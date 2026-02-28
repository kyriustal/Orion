import { Router } from 'express';
import { getSupabase } from "../services/supabase.service";

export const whatsappRouter = Router();

// GET /api/whatsapp/config - Obter configurações atuais
whatsappRouter.get('/config', async (req, res) => {
  try {
    const orgId = (req as any).user?.org_id || "00000000-0000-0000-0000-000000000000";
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('phone_number_id, waba_id, is_active, webhook_status')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    res.json(data || {
      phone_number_id: '',
      waba_id: '',
      is_active: false,
      webhook_status: 'disconnected'
    });
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar configurações do WhatsApp" });
  }
});

// POST /api/whatsapp/config - Salvar/Atualizar credenciais da Meta
whatsappRouter.post('/config', async (req, res) => {
  try {
    const orgId = (req as any).user?.org_id || "00000000-0000-0000-0000-000000000000";
    const { phone_number_id, waba_id, access_token } = req.body;
    const supabase = getSupabase();

    const { data: existing } = await supabase.from('whatsapp_configs').select('id').eq('org_id', orgId).single();

    if (existing) {
      await supabase.from('whatsapp_configs')
        .update({ phone_number_id, waba_id, access_token, webhook_status: 'connected', is_active: true })
        .eq('org_id', orgId);
    } else {
      await supabase.from('whatsapp_configs')
        .insert([{ org_id: orgId, phone_number_id, waba_id, access_token, webhook_status: 'connected', is_active: true }]);
    }

    res.json({ message: 'Configurações do WhatsApp atualizadas com sucesso.' });
  } catch (e) {
    res.status(500).json({ error: "Erro ao salvar configurações do WhatsApp" });
  }
});
