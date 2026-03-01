import { Router } from 'express';

export const automationsRouter = Router();

// GET /api/automations - Listar automações/campanhas
automationsRouter.get('/', async (req, res) => {
  const orgId = req.user?.org_id;

  res.json([
    { id: 'auto-1', name: 'Boas-vindas Novos Clientes', type: 'flow', status: 'active' },
    { id: 'auto-2', name: 'Promoção Black Friday', type: 'broadcast', status: 'draft' }
  ]);
});

// POST /api/automations - Criar nova automação
automationsRouter.post('/', async (req, res) => {
  const { name, type, config } = req.body;
  // TODO: Salvar na tabela automations
  res.status(201).json({ message: 'Automação criada com sucesso.', id: 'auto-3' });
});

// POST /api/automations/campaigns/send - Enviar mensagens em massa
automationsRouter.post('/campaigns/send', async (req, res) => {
  try {
    const { name, template, audience, filters } = req.body;

    // Simulate fetching contacts based on audience and filters
    const contacts = [
      { id: 1, phone: "+244923000001", name: "Cliente 1" },
      { id: 2, phone: "+244923000002", name: "Cliente 2" },
      { id: 3, phone: "+244923000003", name: "Cliente 3" },
    ];

    // Start background job for sending messages
    // We don't await this so the request returns immediately
    (async () => {
      console.log(`[CAMPANHA] Iniciando: "${name}" - ${contacts.length} destinatários.`);
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        console.log(`[CAMPANHA] Enviando (${i + 1}/${contacts.length}) template "${template}" para ${contact.phone}...`);

        // TODO: Call Meta API to send template message
        // await WhatsAppService.sendTemplateMessage(phoneNumberId, accessToken, contact.phone, template);

        // DELAY de 3 segundos por destinatário conforme políticas da Meta.
        // Não remover: reduz risco de banimento por spam.
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      console.log(`[CAMPANHA] "${name}" concluída. ${contacts.length} mensagens enviadas.`);
    })();

    res.json({
      message: `Campanha "${name}" iniciada com sucesso. ${contacts.length} mensagens estão sendo enviadas em background com delay de 3s por número (política da Meta).`,
      estimatedTime: contacts.length * 3 // 3 seconds per contact
    });
  } catch (error) {
    console.error("Erro ao iniciar campanha:", error);
    res.status(500).json({ error: "Erro ao iniciar campanha." });
  }
});

// POST /api/automations/:id/trigger - Disparar automação manualmente (ex: Broadcast)
automationsRouter.post('/:id/trigger', async (req, res) => {
  const { id } = req.params;
  // TODO: Iniciar job assíncrono para envio em massa respeitando delay de 1s
  res.json({ message: 'Disparo de automação iniciado em background.' });
});

// PUT /api/automations/:id/toggle - Ativar/Desativar automação
automationsRouter.put('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' ou 'inactive'
  res.json({ message: `Automação ${status === 'active' ? 'ativada' : 'desativada'}.` });
});
