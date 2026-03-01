import { GeminiService } from "./gemini.service";
import { OpenAIService } from "./openai.service";

export class AIOrchestratorService {
    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string,
        tools: any[] = []
    ): Promise<{ text: string; functionCalls?: any[] }> {
        try {
            return await GeminiService.generateChatResponse(systemInstruction, history, message, tools);
        } catch (error: any) {
            console.warn("[AIOrchestrator] Falha no Gemini, tentando OpenAI Fallback...", error.message);

            if (!process.env.OPENAI_API_KEY) {
                return { text: "⚠️ O serviço de IA está instável. Por favor, tente novamente em instantes." };
            }

            try {
                return await OpenAIService.generateChatResponseReal(systemInstruction, history, message);
            } catch (fallbackError: any) {
                console.error("[AIOrchestrator] Falha Total:", fallbackError.message);
                return { text: "❌ Motores de IA indisponíveis no momento." };
            }
        }
    }
}
