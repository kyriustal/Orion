import { Router, Request, Response } from 'express';
import { getSupabase } from "../services/supabase.service";
import { requireAuth } from '../middleware/auth.middleware';

export const whatsappRouter = Router();

// GET /api/whatsapp/config - Obter configurações atuais
whatsappRouter.get('/config', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.org_id;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('whatsapp_configs')
      .select('phone_number_id, waba_id, is_active, webhook_status, app_id, client_secret, display_name, business_category, description, profile_picture_url, website, support_email')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found

    res.json(data || {
      phone_number_id: '',
      waba_id: '',
      app_id: '',
      client_secret: '',
      display_name: '',
      business_category: '',
      description: '',
      profile_picture_url: '',
      website: '',
      support_email: '',
      is_active: false,
      webhook_status: 'disconnected'
    });
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar configurações do WhatsApp" });
  }
});

// POST /api/whatsapp/config - Salvar/Atualizar credenciais da Meta e Perfil do Bot
whatsappRouter.post('/config', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.org_id;
    const {
      phone_number_id, waba_id, access_token,
      app_id, client_secret, display_name,
      business_category, description, profile_picture_url,
      website, support_email
    } = req.body;

    const supabase = getSupabase();

    const { data: existing } = await supabase.from('whatsapp_configs').select('id').eq('org_id', orgId).single();

    const payload = {
      phone_number_id, waba_id, access_token,
      app_id, client_secret, display_name,
      business_category, description, profile_picture_url,
      website, support_email,
      webhook_status: 'connected',
      is_active: true
    };

    if (existing) {
      await supabase.from('whatsapp_configs')
        .update(payload)
        .eq('org_id', orgId);
    } else {
      await supabase.from('whatsapp_configs')
        .insert([{ org_id: orgId, ...payload }]);
    }

    res.json({ message: 'Configurações do WhatsApp atualizadas com sucesso.' });
  } catch (e) {
    res.status(500).json({ error: "Erro ao salvar configurações do WhatsApp" });
  }
});
