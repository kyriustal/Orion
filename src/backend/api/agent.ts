import { Router } from 'express';
import { getSupabase } from '../services/supabase.service.ts';
import { AIOrchestratorService } from '../services/ai_orchestrator.service.ts';
import { GeminiService } from '../services/gemini.service.ts';

export const agentRouter = Router();

// ─── POST /api/agent/simulate ─────────────────────────────────────────────────
agentRouter.post('/simulate', async (req, res) => {
    const { message, history } = req.body;
    const org_id = (req as any).user?.org_id || '00000000-0000-0000-0000-000000000000';

    if (!message?.trim()) {
        return res.status(400).json({ error: 'Mensagem vazia.' });
    }

    try {
        const supabase = getSupabase();

        // 1. Buscar dados completos da organização
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', org_id)
            .single();

        if (orgError) {
            console.warn('[Agent] Org não encontrada, usando defaults.');
        }

        // 2. Buscar configuração do WhatsApp/Bot
        const { data: waConfig } = await supabase
            .from('whatsapp_configs')
            .select('display_name, description')
            .eq('org_id', org_id)
            .single();

        // 3. Busca RAG (Conhecimento Vetorial)
        let knowledge = "";
        try {
            const embedding = await GeminiService.generateEmbeddings(message);
            const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
                query_embedding: embedding,
                match_threshold: 0.3,
                match_count: 5,
                p_org_id: org_id
            });

            if (chunks?.length > 0) {
                knowledge = chunks.map((c: any) => c.content).join("\n\n---\n\n");
                console.log(`[Agent] 🔍 RAG: ${chunks.length} chunks encontrados`);
            }
        } catch (ragError: any) {
            console.warn('[Agent] RAG falhou:', ragError.message);
            // Usar descrição da empresa como fallback
            knowledge = org?.product_description || "";
        }

        // 4. Construir system prompt inteligente e contextual
        const botName = org?.chatbot_name || waConfig?.display_name || 'Orion';
        const companyName = org?.name || 'a empresa';
        const description = org?.product_description || org?.social_object || waConfig?.description || '';
        const useEmojis = org?.use_emojis !== false;

        const systemInstruction = buildSystemPrompt(botName, companyName, description, knowledge, useEmojis);

        // 5. Normalizar histórico para o formato correto do Gemini
        const normalizedHistory = (history || []).map((h: any) => ({
            role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
            parts: Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts || h.content || '') }]
        }));

        // 6. Gerar resposta da IA
        const response = await AIOrchestratorService.generateChatResponse(
            systemInstruction,
            normalizedHistory,
            message
        );

        // 7. Salvar conversa no banco (sessão de simulação)
        const sessionId = `sim-${org_id}-${Date.now()}`;
        await supabase.from('chat_sessions').upsert({
            id: sessionId,
            org_id: org_id,
            user_phone: 'Simulação Web',
            last_interaction: new Date().toISOString()
        }, { onConflict: 'id' });

        await supabase.from('messages').insert([
            { session_id: sessionId, role: 'user', content: message },
            { session_id: sessionId, role: 'model', content: response.text }
        ]);

        res.json({ reply: response.text });
    } catch (error: any) {
        console.error('[Agent API] Erro:', error.message);
        res.status(500).json({ error: "Erro interno ao processar mensagem." });
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
        ? `## Base de Conhecimento (Referência Principal)\nUse as informações abaixo para responder. Dê sempre prioridade a estes dados:\n\n---\n${knowledge}\n---`
        : `## Conhecimento\nUse seu conhecimento geral para ajudar o cliente de forma educada e profissional sobre os serviços de ${companyName}.`;

    return `Você é ${botName}, o assistente virtual inteligente e exclusivo de ${companyName}.

## Identidade
- Seu nome é **${botName}** e você representa **${companyName}**
- Seja sempre profissional, caloroso, empático e prestativo
${emojiRule}
- Responda SEMPRE em português (adapte ao dialeto do cliente: Portugal ou Brasil)

## Missão
Você existe para ajudar os clientes de ${companyName} de forma completa, inteligente e eficiente:
1. Responder dúvidas sobre serviços, produtos, processos e preços
2. Ajudar o cliente a tomar a melhor decisão com base nas suas necessidades
3. Guiar pelo processo de contratação, compra ou agendamento
4. Recolher informações relevantes quando necessário para personalizar o atendimento
5. Encaminhar para um atendente humano APENAS quando absolutamente necessário

## Sobre a Empresa
${description || `${companyName} é uma empresa comprometida em oferecer serviços de qualidade excepcional aos seus clientes.`}

${knowledgeSection}

## Regras de Comportamento
- Seja CONCRETO e OBJETIVO — evite respostas genéricas, vagas ou evasivas
- Responda de forma completa e detalhada quando o cliente precisar de informações
- Se não souber algo específico, seja honesto e ofereça uma alternativa útil
- NUNCA invente preços, prazos ou informações técnicas que não estejam confirmadas
- Sempre que possível, direcione o cliente para a próxima ação prática e concreta
- Mantenha o foco nos serviços de ${companyName}
- Quando o cliente estiver pronto para avançar, recolha os dados necessários de forma organizada
- Trate cada cliente de forma personalizada e única`;
}
