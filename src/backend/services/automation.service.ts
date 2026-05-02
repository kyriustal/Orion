import { getSupabase } from './supabase.service';

export class AutomationService {
    /**
     * Tenta identificar se uma mensagem do usuário deve disparar uma automação.
     * @param orgId ID da Organização
     * @param message Mensagem do Usuário
     * @returns A automação disparada ou null
     */
    static async triggerAutomation(orgId: string, message: string) {
        const supabase = getSupabase();
        
        // 1. Buscar automações ativas da organização
        const { data: automations } = await supabase
            .from('automations')
            .select('*')
            .eq('org_id', orgId)
            .eq('status', 'active');

        if (!automations || automations.length === 0) return null;

        // 2. Lógica simples de gatilho (por enquanto por palavras-chave na config)
        // No futuro, isso pode ser feito via IA (Function Calling)
        for (const auto of automations) {
            const keywords = auto.config?.keywords || [];
            const msgLower = message.toLowerCase();
            
            if (keywords.some((kw: string) => msgLower.includes(kw.toLowerCase()))) {
                console.log(`[Automation] Gatilho ativado: "${auto.name}" para a mensagem: "${message}"`);
                return auto;
            }
        }

        return null;
    }

    /**
     * Executa uma ação de automação.
     */
    static async executeAction(automation: any, context: any) {
        const type = automation.type;
        const config = automation.config;

        switch (type) {
            case 'lead_capture':
                // Exemplo: Salvar em uma tabela de leads
                console.log("[Automation] Executando Lead Capture...");
                return { reply: config?.success_message || "Obrigado! Seus dados foram anotados." };
            
            case 'auto_reply':
                return { reply: config?.reply_text };

            default:
                return null;
        }
    }
}
