export class PaystackService {
    private static readonly API_URL = "https://api.paystack.co";
    private static readonly SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "sk_test_example"; // Definir no .env depois

    /**
     * Inicializa uma sessão de Checkout (Transação) para gerar um formulário de pagamento
     */
    static async initializeTransaction(email: string, amountKwanza: number, orgId: string) {
        // Paystack funciona em centavos da menor moeda, mas para AOA enviamos diretamente o valor x 100
        const amountInCentavos = amountKwanza * 100;

        try {
            const response = await fetch(`${this.API_URL}/transaction/initialize`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.SECRET_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    amount: amountInCentavos,
                    currency: "AOA",
                    callback_url: "https://app.orion-agents.com/dashboard/billing/success",
                    metadata: {
                        org_id: orgId,
                        custom_fields: [
                            {
                                display_name: "Empresa ID",
                                variable_name: "org_id",
                                value: orgId
                            }
                        ]
                    }
                })
            });

            const data = await response.json();
            if (!data.status) throw new Error(data.message);

            return data.data.authorization_url; // URL para o Inquilino inserir o cartão ou referência
        } catch (error) {
            console.error("[Paystack] Erro ao inicializar transação:", error);
            throw error;
        }
    }

    /**
     * Verifica o status de uma transação finalizada pelo Webhook / Reference callback
     */
    static async verifyTransaction(reference: string) {
        try {
            const response = await fetch(`${this.API_URL}/transaction/verify/${reference}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.SECRET_KEY}`,
                    "Content-Type": "application/json"
                }
            });

            const data = await response.json();
            return data; // Contém 'status: "success"' e os metadata com o org_id
        } catch (error) {
            console.error("[Paystack] Falha ao verificar transação:", error);
            throw error;
        }
    }
}
