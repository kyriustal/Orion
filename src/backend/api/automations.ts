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
      console.log(`Starting campaign: ${name} with ${contacts.length} contacts`);
      for (const contact of contacts) {
        console.log(`Sending template ${template} to ${contact.phone}...`);
        
        // TODO: Call Meta API to send template message
        
        // Atraso de 2 segundos por destinatário para não ferir as políticas da Meta
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.log(`Campaign ${name} finished.`);
    })();

    res.json({ 
      message: 'Campanha iniciada com sucesso. As mensagens estão sendo enviadas em background.',
      estimatedTime: contacts.length * 2 // 2 seconds per contact
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
