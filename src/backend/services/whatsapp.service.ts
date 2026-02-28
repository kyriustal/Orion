export class WhatsAppService {
  /**
   * Dispara mensagem via HTTPX/Fetch para a API Oficial da Meta
   */
  static async sendMessage(phoneNumberId: string, accessToken: string, to: string, text: string) {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: { preview_url: false, body: text }
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Tratamento de erro 131030 (Fora da janela de 24h)
        if (data.error?.code === 131030) {
          console.error(`[WhatsApp] Erro 131030: Fora da janela de 24h para o número ${to}`);
          // Lógica adicional: notificar sistema, enviar template message, etc.
        }
        throw new Error(`WhatsApp API Error: ${JSON.stringify(data)}`);
      }
      
      return data;
    } catch (error) {
      console.error('[WhatsApp] Falha ao enviar mensagem:', error);
      // Não lançamos o erro para não quebrar o loop do webhook
      return null; 
    }
  }
}
