import { GoogleGenAI } from '@google/genai';

// Inicialização lazy para não quebrar na inicialização se faltar a chave
let ai: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAwIN4X0wQkNQi8BdIyRfQ_FCgY1JmFzoM";
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export class GeminiService {
  /**
   * Integração assíncrona com o Gemini mantendo o contexto da conversa
   */
  static async generateResponse(
    systemPrompt: string,
    history: { role: string, content: string }[],
    newMessage: string,
    model: string = 'gemini-1.5-flash'
  ) {
    try {
      const client = getGeminiClient();

      // Formatar histórico para o formato do Gemini
      const contents = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Adicionar a nova mensagem
      contents.push({
        role: 'user',
        parts: [{ text: newMessage }]
      });

      const response = await client.models.generateContent({
        model: model,
        contents: contents as any,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3, // Respostas mais determinísticas e focadas para atendimento
        }
      });

      return response.text;
    } catch (error) {
      console.error('[Gemini Error]', error);
      return "Desculpe, estou enfrentando instabilidades no momento. Tente novamente em instantes.";
    }
  }
}
