import { getSupabase } from "./supabase.service";
import { VIP_UNLIMITED_EMAILS } from "../../lib/constants";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * Dispara o e-mail HTML da Orion via Resend API
 */
async function sendTrialExpiredEmail(toEmail: string, orgName: string) {
    if (!RESEND_API_KEY) {
        console.log(`[CRON] Resend API Key não configurada. Simulando envio para ${toEmail}`);
        return;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Orion Platform <billing@orion-agents.com>',
                to: [toEmail],
                subject: 'O seu teste gratuito da Orion expirou',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="https://i.imgur.com/your-orion-logo-url-here.png" alt="Orion Logo" style="height: 40px;" />
                        </div>
                        <h2 style="color: #059669;">Olá, responsável pela ${orgName}!</h2>
                        <p>Os seus 7 dias de teste gratuito com os agentes de IA da Orion chegaram ao fim!</p>
                        <p>Para que o seu Agente de IA continue respondendo aos seus clientes no WhatsApp sem interrupções e continue faturando, é necessário escolher um plano.</p>
                        
                        <div style="text-align: center; margin: 40px 0;">
                            <a href="https://app.orion-agents.com/dashboard/billing" style="background-color: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Escolher Plano em Kwanzas (Kz)</a>
                        </div>
                        
                        <p>Lembramos que as automações no seu WhatsApp estão atualmente suspensas até que a assinatura seja validada.</p>
                        <p>Atenciosamente,<br><strong>Equipe Orion</strong></p>
                    </div>
                `
            })
        });

        if (!response.ok) {
            console.error(`[CRON] Erro ao enviar email para ${toEmail}:`, await response.text());
        } else {
            console.log(`[CRON] Email de expiração enviado com sucesso para ${toEmail}`);
        }
    } catch (error) {
        console.error(`[CRON] Falha na comunicação com o Resend para ${toEmail}:`, error);
    }
}

/**
 * Verifica diariamente se empresas em período de 'trial' atingiram 7 dias de uso
 */
export async function checkExpiredTrials() {
    console.log("[CRON] Iniciando verificação diária de Testes Gratuitos expirados...");
    const supabase = getSupabase();

    try {
        const { data: orgs, error } = await supabase
            .from('organizations')
            .select('id, name, owner_email, created_at, plan_status, trial_end_date')
            .eq('plan_status', 'trial');

        if (error) throw error;
        if (!orgs || orgs.length === 0) return;

        const now = new Date();

        for (const org of orgs) {
            // Ignora VIPs
            if (VIP_UNLIMITED_EMAILS.includes(org.owner_email)) continue;

            // Se não tiver trial_end_date manual, padroniza 7 dias da criação
            const endDate = org.trial_end_date ? new Date(org.trial_end_date) : new Date(new Date(org.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);

            if (now > endDate) {
                console.log(`[CRON] Org ID ${org.id} (${org.name}) expirou o período de testes.`);

                // Marca como expired
                await supabase.from('organizations').update({ plan_status: 'expired' }).eq('id', org.id);

                // Envia o E-mail de cobrança
                await sendTrialExpiredEmail(org.owner_email, org.name);
            }
        }
        console.log("[CRON] Verificação diária concluída.");
    } catch (err) {
        console.error("[CRON] Erro fatal durante a rotina de verificação:", err);
    }
}

/**
 * Inicia o ciclo do CRON usando setInterval nativo no Node.js
 */
export function startDailyCronJobs() {
    // Roda no boot
    checkExpiredTrials();

    // Roda a cada 24 horas (86400000 ms)
    setInterval(() => {
        checkExpiredTrials();
    }, 24 * 60 * 60 * 1000);
}
