import { Router } from 'express';
import { getSupabase } from "../services/supabase.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { GoogleGenAI } from "@google/genai";
import { OpenAIService } from "../services/openai.service";
import { VIP_UNLIMITED_EMAILS } from "../../lib/constants";

export const webhookRouter = Router();

webhookRouter.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    const value = change.value;
                    if (value.messages && value.messages.length > 0) {
                        const message = value.messages[0];
                        const phoneNumberId = value.metadata.phone_number_id;
                        const from = message.from; // Customer phone
                        const text = message.text?.body;

                        if (text) {
                            console.log(`[WhatsApp] Recebida mensagem de ${from} para ${phoneNumberId}: ${text}`);
                            const supabase = getSupabase();

                            // 1. Validate Meta Phone Number & Org
                            const { data: config } = await supabase
                                .from('whatsapp_configs')
                                .select('org_id, access_token, organizations(id, owner_email, plan_status, messages_used)')
                                .eq('phone_number_id', phoneNumberId)
                                .single();

                            if (!config || !config.access_token || !config.organizations) continue;
                            const org = (Array.isArray(config.organizations) ? config.organizations[0] : config.organizations) as any;

                            // 2. Billing & VIP Verification Filter
                            const isVip = VIP_UNLIMITED_EMAILS.includes(org.owner_email);
                            const maxMessages = 1500; // Starter limit as baseline
                            if (!isVip && org.plan_status !== 'active' && org.plan_status !== 'trial') {
                                console.log(`[Billing] Org ${org.id} has expired or invalid plan.`);
                                continue;
                            }
                            if (!isVip && org.messages_used >= maxMessages && org.plan_status === 'trial') {
                                // Mute the bot if limits are exceeded outside of VIP
                                await WhatsAppService.sendMessage(phoneNumberId, config.access_token, from, "O Teste Gratuito de Inteligência Artificial para este número expirou. Entre em contato com o suporte da empresa.");
                                continue;
                            }

                            const sessionId = `${org.id}_${from}`;

                            // 3. Upsert Chat Session
                            const { data: existingSession } = await supabase.from('chat_sessions').select('id, is_human_overflow').eq('id', sessionId).single();
                            if (!existingSession) {
                                await supabase.from('chat_sessions').insert({ id: sessionId, org_id: org.id, user_phone: from });
                            } else if (existingSession.is_human_overflow) {
                                // If human handed off, AI shouldn't act
                                console.log(`[Human Handoff] Ignoring message for session ${sessionId}`);
                                continue;
                            }

                            // 4. Save Customer Message
                            await supabase.from('messages').insert({ session_id: sessionId, role: 'user', content: text });

                            // 5. Fetch RAG Knowledge base via Vector Search
                            let companyKnowledge = "";
                            try {
                                const { GeminiService } = await import('../services/gemini.service');
                                const queryEmbedding = await GeminiService.generateEmbeddings(text);

                                const { data: chunks, error: rpcError } = await supabase.rpc('match_knowledge_chunks', {
                                    query_embedding: queryEmbedding,
                                    match_threshold: 0.5, // 0.5 de similaridade mínima
                                    match_count: 5, // Traz os top 5 contextos
                                    p_org_id: org.id
                                });

                                if (!rpcError && chunks && chunks.length > 0) {
                                    companyKnowledge = chunks.map((c: any) => c.content).join('\n\n---\n\n');
                                    console.log(`[RAG] Encontrados ${chunks.length} chunks relevantes para a resposta.`);
                                }
                            } catch (ragError) {
                                console.error("[RAG Error] Falha na busca vetorial:", ragError);
                            }

                            // 6. Generate AI Response
                            // 6. Generate AI Response using new REST Service
                            const systemInstruction = `Você é uma Inteligência Artificial avançada que atua como Assistente Virtual de Atendimento desta Empresa.
DIRETRIZES FUNDAMENTAIS:
1. FOCO TOTAL NO CONHECIMENTO: Você DEVE responder a *todas* as perguntas dos clientes com base ÚNICA E EXCLUSIVAMENTE na BASE DE CONHECIMENTO fornecida abaixo. NUNCA invente serviços, preços, regras de frete ou localizações que não estejam no texto.
2. ATENDIMENTO HUMANO: Apenas transfira para o atendimento humano questões que você absolutamente não conseguir resolver com os dados fornecidos, ou situações *verdadeiramente sensíveis* (reclamações extremas, ameaças legais, problemas financeiros complexos).
3. TEXTO LIMPO E PROFISSIONAL: Suas respostas devem ser impecáveis. Use formatação Markdown (*negrito*, listas) para facilitar a leitura. Evite parágrafos gigantes.
4. TOM DE VOZ: Seja extremamente inteligente, educado, direto e acolhedor.
5. EMOJIS: ${org.use_emojis ? "Use no máximo 1 ou 2 emojis por mensagem para manter a empatia." : "NÃO use emojis em nenhuma circunstância."}

BASE DE CONHECIMENTO DA EMPRESA (Sua Única Fonte de Verdade):
------------------------
${companyKnowledge || "A base de conhecimento desta empresa ainda não foi configurada. Informe gentilmente ao cliente que você ainda está em fase de treinamento e peça que aguarde um humano."}
------------------------`;

                            const response = await OpenAIService.generateChatResponse(
                                systemInstruction,
                                [], // Webhook current iteration starts without history memory. Real memory requires DB fetch.
                                text,
                                "gpt-4o-mini"
                            );

                            const replyText = response.text || "Desculpe, não consegui entender.";

                            // 7. Save Bot Message & Update Billing
                            await supabase.from('messages').insert({ session_id: sessionId, role: 'model', content: replyText });

                            if (!isVip) {
                                await supabase.rpc('increment_messages_used', { row_id: org.id });
                                // Alternatively, if RPC is not made yet, safe fallback:
                                await supabase.from('organizations').update({ messages_used: org.messages_used + 1 }).eq('id', org.id);
                            }
                            await supabase.from('chat_sessions').update({ last_interaction: new Date().toISOString() }).eq('id', sessionId);

                            // 8. Dispatch Response to WhatsApp
                            await WhatsAppService.sendMessage(phoneNumberId, config.access_token, from, replyText);
                        }
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
        console.error("Erro no Webhook:", e);
        res.status(500).send('ERROR');
    }
});

webhookRouter.get('/', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.status(200).send('Webhook endpoint ready.');
    }
});
