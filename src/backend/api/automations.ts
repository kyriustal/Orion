import { Router, Request, Response } from 'express';
import { getSupabase } from '../services/supabase.service';
import { requireAuth } from '../middleware/auth.middleware';

export const automationsRouter = Router();

// GET /api/automations - Listar automações/campanhas
automationsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.org_id;
    const supabase = getSupabase();

    const { data: automations, error } = await supabase
      .from('automations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(automations || []);
  } catch (error) {
    console.error("Erro ao listar automações:", error);
    res.status(500).json({ error: "Erro interno ao listar automações." });
  }
});

// POST /api/automations - Criar nova automação
automationsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.org_id;
    const { name, type, config } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Nome e tipo são obrigatórios." });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('automations')
      .insert([{
        org_id: orgId,
        name,
        type,
        config: config || {},
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Automação criada com sucesso.', automation: data });
  } catch (error) {
    console.error("Erro ao criar automação:", error);
    res.status(500).json({ error: "Erro interno ao criar automação." });
  }
});

// GET /api/automations/campaigns - Listar Campanhas
automationsRouter.get('/campaigns', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.org_id;
    const supabase = getSupabase();

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*, whatsapp_templates(name)')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(campaigns || []);
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    res.status(500).json({ error: "Erro interno ao listar campanhas." });
  }
});

// POST /api/automations/campaigns/send - Enviar mensagens em massa
automationsRouter.post('/campaigns/send', requireAuth, async (req: Request, res: Response) => {
  try {
    const orgId = req.user?.org_id;
    const { name, template_id, audience_type, filters } = req.body;

    if (!name || !template_id) {
      return res.status(400).json({ error: "Nome da campanha e ID do template são obrigatórios." });
    }

    const supabase = getSupabase();

    // 1. Criar o registro da Campanha no banco
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([{
        org_id: orgId,
        name,
        template_id,
        audience_type,
        filters,
        status: 'sending'
      }])
      .select()
      .single();

    if (campaignError) throw campaignError;

    // Simulate fetching contacts based on audience and filters
    const contacts = [
      { id: 1, phone: "+244923000001", name: "Cliente 1" },
      { id: 2, phone: "+244923000002", name: "Cliente 2" },
      { id: 3, phone: "+244923000003", name: "Cliente 3" },
    ];

    // Start background job for sending messages
    // We don't await this so the request returns immediately
    (async () => {
      console.log(`[CAMPANHA ${campaign.id}] Iniciando: "${name}" - ${contacts.length} destinatários.`);

      let sentCount = 0;

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        console.log(`[CAMPANHA] Enviando (${i + 1}/${contacts.length}) template ID "${template_id}" para ${contact.phone}...`);

        // TODO: Call Meta API to send template message
        // await WhatsAppService.sendTemplateMessage(phoneNumberId, accessToken, contact.phone, template);

        sentCount++;

        // Atualiza progresso da campanha a cada X mensagens sentidos
        if (sentCount % 10 === 0 || i === contacts.length - 1) {
          await supabase.from('campaigns').update({ sent_count: sentCount, total_count: contacts.length }).eq('id', campaign.id);
        }

        // DELAY de 3 segundos por destinatário conforme políticas da Meta.
        // Não remover: reduz risco de banimento por spam.
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      // Conclui a campanha
      await supabase.from('campaigns').update({ status: 'completed', sent_count: sentCount, total_count: contacts.length }).eq('id', campaign.id);
      console.log(`[CAMPANHA] "${name}" concluída. ${contacts.length} mensagens enviadas.`);
    })();

    res.json({
      message: `Campanha "${name}" iniciada com sucesso. ${contacts.length} mensagens estão sendo enviadas em background com delay de 3s por número (política da Meta).`,
      campaign_id: campaign.id,
      estimatedTime: contacts.length * 3 // 3 seconds per contact
    });
  } catch (error) {
    console.error("Erro ao iniciar campanha:", error);
    res.status(500).json({ error: "Erro ao iniciar campanha." });
  }
});

// POST /api/automations/:id/trigger - Disparar automação manualmente (ex: Broadcast)
automationsRouter.post('/:id/trigger', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  // TODO: Iniciar job assíncrono para envio em massa respeitando delay de 3s
  res.json({ message: 'Disparo de automação iniciado em background.' });
});

// PUT /api/automations/:id/toggle - Ativar/Desativar automação
automationsRouter.put('/:id/toggle', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' ou 'inactive'
    const orgId = req.user?.org_id;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('automations')
      .update({ status })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `Automação ${status === 'active' ? 'ativada' : 'desativada'}.`, automation: data });
  } catch (error) {
    console.error("Erro ao alternar status da automação:", error);
    res.status(500).json({ error: "Erro interno ao alterar automação." });
  }
});
