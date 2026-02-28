import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';

export const subscriptionsRouter = Router();

// POST /api/subscriptions/start-trial
subscriptionsRouter.post('/start-trial', requireAuth, async (req, res) => {
  const orgId = req.user?.org_id;
  const { planId } = req.body;

  // Lógica de Negócio:
  // 1. Verificar se a organização já teve um trial antes
  // 2. Definir trial_ends_at para NOW() + 7 dias
  // 3. Atualizar o status para 'trialing'
  
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  // TODO: Update organizations set plan_id = planId, trial_ends_at = trialEndsAt, subscription_status = 'trialing' where id = orgId

  res.json({ 
    message: 'Período de teste de 7 dias iniciado com sucesso!',
    trial_ends_at: trialEndsAt.toISOString(),
    status: 'trialing'
  });
});

// GET /api/subscriptions/status
subscriptionsRouter.get('/status', requireAuth, async (req, res) => {
  const orgId = req.user?.org_id;

  // TODO: Buscar status real do banco
  const mockTrialEnd = new Date();
  mockTrialEnd.setDate(mockTrialEnd.getDate() + 7);

  res.json({
    status: 'trialing',
    trial_ends_at: mockTrialEnd.toISOString(),
    plan_name: 'Pro',
    is_active: true
  });
});
