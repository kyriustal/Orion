import { GeminiService } from './gemini.service';
import { OpenAIService } from './openai.service';

export class AIOrchestratorService {
    /**
     * Gera resposta de chat usando Gemini com fallback para OpenAI.
     */
    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string
    ): Promise<{ text: string }> {
        console.log("[AI Orchestrator] Gerando resposta...");

        // 1. Tentar Gemini primeiro (Mais rapido e barato)
        try {
            const response = await GeminiService.generateChatResponse(
                systemInstruction,
                history,
                message
            );
            return response;
        } catch (geminiError: any) {
            console.warn("[AI Orchestrator] Gemini falhou, tentando OpenAI...", geminiError.message);
            
            // 2. Fallback para OpenAI
            try {
                const response = await OpenAIService.generateChatResponseReal(
                    systemInstruction,
                    history,
                    message
                );
                return response;
            } catch (openaiError: any) {
                console.error("[AI Orchestrator] Ambos os modelos falharam!");
                return { text: "Desculpe, estou enfrentando instabilidade momentanea. Por favor, tente novamente em instantes." };
            }
        }
    }
}
