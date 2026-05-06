import { GeminiService } from './gemini.service';
import { OpenAIService } from './openai.service';

export class AIOrchestratorService {
    /**
     * Gera resposta de chat usando Gemini como principal, OpenAI como fallback.
     * Implementa retry automático com backoff exponencial.
     */
    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string,
        retries = 2
    ): Promise<{ text: string }> {
        console.log("[AI Orchestrator] Gerando resposta...");

        // 1. Tentar Gemini (principal — mais rápido e inteligente)
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await GeminiService.generateChatResponse(
                    systemInstruction,
                    history,
                    message
                );
                if (response?.text) {
                    console.log(`[AI Orchestrator] ✅ Gemini respondeu (tentativa ${attempt})`);
                    return response;
                }
            } catch (geminiError: any) {
                console.warn(`[AI Orchestrator] Gemini falhou (tentativa ${attempt}/${retries}):`, geminiError.message);
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, 1000 * attempt)); // backoff
                }
            }
        }

        // 2. Fallback para OpenAI
        console.warn("[AI Orchestrator] Tentando OpenAI como fallback...");
        try {
            const response = await OpenAIService.generateChatResponseReal(
                systemInstruction,
                history,
                message
            );
            if (response?.text) {
                console.log("[AI Orchestrator] ✅ OpenAI respondeu como fallback");
                return response;
            }
        } catch (openaiError: any) {
            console.error("[AI Orchestrator] OpenAI também falhou:", openaiError.message);
        }

        // 3. Último recurso — mensagem de erro controlada
        console.error("[AI Orchestrator] ❌ Todos os modelos falharam.");
        return {
            text: "Desculpe, estou com dificuldades técnicas neste momento. Por favor, tente novamente em instantes ou contacte-nos diretamente."
        };
    }
}
