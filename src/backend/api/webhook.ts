import { Router } from 'express';
import { getSupabase } from "../services/supabase.service";

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
                                .select('org_id, phone_number_id, organizations(id)')
                                .eq('phone_number_id', phoneNumberId)
                                .single();

                            if (!config || !config.organizations) continue;
                            const org = (Array.isArray(config.organizations) ? config.organizations[0] : config.organizations) as any;

                            const sessionId = `${org.id}_${from}`;

                            // 2. Upsert Chat Session
                            const { data: existingSession } = await supabase.from('chat_sessions').select('id').eq('id', sessionId).single();
                            if (!existingSession) {
                                await supabase.from('chat_sessions').insert({ id: sessionId, org_id: org.id, user_phone: from });
                            }

                            // 3. Save Customer Message
                            await supabase.from('messages').insert({ session_id: sessionId, role: 'user', content: text });

                            await supabase.from('chat_sessions').update({ last_interaction: new Date().toISOString() }).eq('id', sessionId);

                            console.log(`[WhatsApp] Mensagem de ${from} registrada com sucesso. IA desativada.`);
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
