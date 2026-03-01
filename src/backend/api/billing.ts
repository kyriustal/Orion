import { Router } from "express";
import { getSupabase } from "../services/supabase.service";
import { PaystackService } from "../services/paystack.service";
import { requireAuth } from "../middleware/auth.middleware";

export const billingRouter = Router();

/**
 * 0. Buscar as Informações do Plano Atual (Limites e Uso)
 */
billingRouter.get("/status", requireAuth, async (req, res) => {
    try {
        const orgId = req.user.org_id;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('organizations')
            .select('plan_status, messages_used, trial_end_date')
            .eq('id', orgId)
            .single();

        if (error) throw error;

        // Define o limite baseado no plano, similar ao que foi definido no webhook
        let limit = 1500; // trial ou starter
        if (data.plan_status === 'scale') limit = 10000;
        if (data.plan_status === 'enterprise') limit = 100000;

        res.json({
            plan_status: data.plan_status,
            messages_used: data.messages_used,
            messages_limit: limit,
            trial_end_date: data.trial_end_date
        });
    } catch (error: any) {
        console.error("Erro ao buscar status do plano:", error);
        res.status(500).json({ error: "Falha ao buscar as informações do plano." });
    }
});

/**
 * 1. Inicializa a Cobrança quando o usuário clica no Plano dentro do Painel (Requer Auth)
 */
billingRouter.post("/checkout", requireAuth, async (req, res) => {
    try {
        const { planId } = req.body;
        const orgId = req.user.org_id;
        const email = req.user.email;

        // Determinar o preço em Kwanza (AOA) com base no plano escolhido (Starter, Scale, Enterprise)
        let amount = 0;
        if (planId === "starter") amount = 18990;
        else if (planId === "scale") amount = 35990;
        else if (planId === "enterprise") amount = 69500;
        else return res.status(400).json({ error: "Plano inválido." });

        const checkoutUrl = await PaystackService.initializeTransaction(email, amount, orgId);

        res.json({ checkoutUrl });
    } catch (error: any) {
        res.status(500).json({ error: "Falha ao gerar o link de pagamento. Tente novamente." });
    }
});

/**
 * 2. Webhook que a Paystack atinge livremente para validar quando o cliente paga
 */
billingRouter.post("/paystack/webhook", async (req, res) => {
    const event = req.body;

    // Opcional/Recomendado: Validar a assinatura HMAC (x-paystack-signature) para segurança em PROD

    if (event.event === "charge.success") {
        const reference = event.data.reference;
        const orgId = event.data.metadata?.org_id;
        const amountPaid = event.data.amount / 100; // Converter de centavos

        if (orgId) {
            console.log(`[Billing] Recebido Pagamento Paystack de AOA ${amountPaid} para a Org ${orgId}. Ativando plano...`);
            const supabase = getSupabase();

            // Ativa o plano da organização e zera o contador de mensagens
            await supabase
                .from('organizations')
                .update({ plan_status: 'active', messages_used: 0 })
                .eq('id', orgId);
        }
    }

    res.sendStatus(200);
});
