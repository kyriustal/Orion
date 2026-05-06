import { Router } from 'express';
import { getSupabase } from "../services/supabase.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { AIOrchestratorService } from "../services/ai_orchestrator.service";
import { GeminiService } from "../services/gemini.service";

export const webhookRouter = Router();

// ─── GET: Verificação inicial do Webhook pelo Meta ────────────────────────────
webhookRouter.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`[Webhook] Verificação Meta: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
        console.log('[Webhook] ✅ Webhook verificado com sucesso!');
        return res.status(200).send(challenge);
    }

    console.warn('[Webhook] ❌ Token de verificação inválido.');
    return res.status(403).send('Forbidden');
});

// ─── POST: Receber mensagens do WhatsApp ──────────────────────────────────────
webhookRouter.post('/', async (req, res) => {
    // Responder IMEDIATAMENTE ao Meta para evitar timeout e reenvios
    res.status(200).send('EVENT_RECEIVED');

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                const value = change.value;
                if (!value?.messages?.length) continue;

                const message = value.messages[0];
                const phoneNumberId = value.metadata?.phone_number_id;
                const from = message.from;
                const text = message.text?.body;

                if (!text || !phoneNumberId) continue;

                console.log(`[Webhook] 📨 Mensagem de ${from}: "${text}"`);

                const supabase = getSupabase();

                // 1. Buscar configuração da empresa pelo número de telefone
                const { data: config, error: configError } = await supabase
                    .from('whatsapp_configs')
                    .select(`
                        org_id, access_token, display_name, description,
                        organizations (
                            id, name, use_emojis, chatbot_name,
                            product_description, social_object
                        )
                    `)
                    .eq('phone_number_id', phoneNumberId)
                    .eq('is_active', true)
                    .single();

                if (configError || !config?.organizations) {
                    console.warn(`[Webhook] Nenhuma org encontrada para phone_number_id: ${phoneNumberId}`);
                    continue;
                }

                const org = (Array.isArray(config.organizations)
                    ? config.organizations[0]
                    : config.organizations) as any;

                const sessionId = `${org.id}_${from}`;

                // 2. Criar/atualizar sessão de chat (upsert seguro)
                await supabase.from('chat_sessions').upsert({
                    id: sessionId,
                    org_id: org.id,
                    user_phone: from,
                    last_interaction: new Date().toISOString()
                }, { onConflict: 'id' });

                // 3. Buscar histórico recente (últimas 10 mensagens para contexto)
                const { data: recentMessages } = await supabase
                    .from('messages')
                    .select('role, content')
                    .eq('session_id', sessionId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                const history = (recentMessages || [])
                    .reverse()
                    .map(m => ({
                        role: m.role === 'model' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));

                // 4. Busca RAG (Conhecimento Vetorial)
                let knowledge = "";
                try {
                    const embedding = await GeminiService.generateEmbeddings(text);
                    const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
                        query_embedding: embedding,
                        match_threshold: 0.4,
                        match_count: 5,
                        p_org_id: org.id
                    });
                    if (chunks?.length > 0) {
                        knowledge = chunks.map((c: any) => c.content).join("\n\n---\n\n");
                        console.log(`[Webhook] 🔍 RAG: ${chunks.length} chunks encontrados`);
                    }
                } catch (ragErr) {
                    console.warn('[Webhook] RAG falhou, continuando sem contexto vetorial:', ragErr);
                }

                // 5. Construir system prompt inteligente
                const botName = org.chatbot_name || config.display_name || 'Assistente';
                const companyName = org.name || 'a empresa';
                const description = org.product_description || org.social_object || config.description || '';
                const useEmojis = org.use_emojis !== false;

                const systemInstruction = buildSystemPrompt(botName, companyName, description, knowledge, useEmojis);

                // 6. Gerar resposta da IA
                const aiResponse = await AIOrchestratorService.generateChatResponse(
                    systemInstruction,
                    history,
                    text
                );
                const replyText = aiResponse.text;

                // 7. Salvar mensagens no banco
                await supabase.from('messages').insert([
                    { session_id: sessionId, role: 'user', content: text },
                    { session_id: sessionId, role: 'model', content: replyText }
                ]);

                // 8. Enviar resposta pelo WhatsApp
                await WhatsAppService.sendMessage(phoneNumberId, config.access_token, from, replyText);
                console.log(`[Webhook] ✅ Resposta enviada para ${from}`);
            }
        }
    } catch (e: any) {
        console.error('[Webhook] Erro crítico:', e.message);
    }
});

// ─── HELPER: Construir prompt do sistema ──────────────────────────────────────
function buildSystemPrompt(
    botName: string,
    companyName: string,
    description: string,
    knowledge: string,
    useEmojis: boolean
): string {
    const emojiRule = useEmojis
        ? '- Use emojis de forma moderada e natural para tornar a conversa mais agradável'
        : '- Não use emojis nas respostas';

    const knowledgeSection = knowledge
        ? `## Base de Conhecimento (Referência Principal)\nUse as informações abaixo para responder. Dê prioridade a estes dados:\n\n---\n${knowledge}\n---`
        : `## Conhecimento\nUse seu conhecimento geral para ajudar o cliente de forma educada e profissional sobre os serviços de ${companyName}.`;

    return `Você é ${botName}, o assistente virtual inteligente de ${companyName}.

## Identidade
- Seu nome é **${botName}** e você representa **${companyName}**
- Seja sempre profissional, caloroso, empático e prestativo
${emojiRule}
- Responda SEMPRE em português (adapte ao dialeto do cliente)

## Missão
Você existe para ajudar os clientes de ${companyName} de forma completa e eficiente:
1. Responder dúvidas sobre serviços, produtos e processos
2. Ajudar o cliente a tomar a melhor decisão
3. Guiar pelo processo de contratação ou compra
4. Recolher informações quando necessário para personalizar o atendimento
5. Encaminhar para humano APENAS quando for absolutamente necessário

## Sobre a Empresa
${description || `${companyName} é uma empresa comprometida em oferecer serviços de qualidade.`}

${knowledgeSection}

## Regras de Comportamento
- Seja CONCRETO e OBJETIVO — evite respostas genéricas ou vagas
- Se não souber algo específico, seja honesto e ofereça uma alternativa
- NUNCA invente preços, prazos ou informações técnicas não confirmadas
- Sempre que possível, direcione o cliente para a próxima ação prática
- Mantenha o foco nos serviços de ${companyName}
- Quando o cliente estiver pronto, peça os dados necessários para avançar`;
}
