import { Router } from 'express';
import { getSupabase } from "../services/supabase.service";
import { WhatsAppService } from "../services/whatsapp.service";
import { AIOrchestratorService } from "../services/ai_orchestrator.service";
import { GeminiService } from "../services/gemini.service";

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
                        const from = message.from;
                        const text = message.text?.body;

                        if (text) {
                            const supabase = getSupabase();

                            // 1. Configuração da Empresa
                            const { data: config } = await supabase
                                .from('whatsapp_configs')
                                .select('org_id, access_token, display_name, description, organizations(id, use_emojis)')
                                .eq('phone_number_id', phoneNumberId)
                                .single();

                            if (!config || !config.organizations) continue;
                            const org = (Array.isArray(config.organizations) ? config.organizations[0] : config.organizations) as any;
                            const sessionId = `${org.id}_${from}`;

                            // 2. Busca RAG (Vetorial)
                            let knowledge = "";
                            try {
                                const embedding = await GeminiService.generateEmbeddings(text);
                                const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
                                    query_embedding: embedding,
                                    match_threshold: 0.5,
                                    match_count: 3,
                                    p_org_id: org.id
                                });
                                if (chunks) knowledge = chunks.map((c: any) => c.content).join("\n\n");
                            } catch (e) { console.error("RAG Error:", e); }

                            // 3. Gerar Resposta IA
                            const systemInstruction = `Você é ${config.display_name || 'Orion'}. 
                            Contexto: ${knowledge || 'Responda com base no seu conhecimento geral educado.'}
                            Emoji: ${org.use_emojis ? 'Sim' : 'Não'}`;

                            const aiResponse = await AIOrchestratorService.generateChatResponse(systemInstruction, [], text);
                            const replyText = aiResponse.text;

                            // 4. Salvar e Enviar
                            await supabase.from('messages').insert({ session_id: sessionId, role: 'model', content: replyText });
                            await WhatsAppService.sendMessage(phoneNumberId, config.access_token, from, replyText);
                        }
                    }
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } catch (e) {
        res.status(500).send('ERROR');
    }
});

webhookRouter.get('/', (req, res) => {
    const challenge = req.query['hub.challenge'];
    res.status(200).send(challenge);
});
