import { GeminiService } from "./gemini.service";
import { OpenAIService } from "./openai.service";
import { FunctionDeclaration } from "@google/genai";

export class AIOrchestratorService {
    /**
     * Tenta gerar uma resposta usando Gemini. Se falhar por cota ou erro de serviço,
     * tenta automaticamente a OpenAI como fallback.
     */
    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string,
        tools: { functionDeclarations: FunctionDeclaration[] }[] = []
    ): Promise<{ text: string; functionCalls?: any[] }> {

        try {
            console.log("[AIOrchestrator] Tentando resposta via Google Gemini...");
            return await GeminiService.generateChatResponse(systemInstruction, history, message, tools);
        } catch (geminiError: any) {
            console.error("[AIOrchestrator] Falha no Gemini. Erro:", geminiError.message);

            // Verificamos se há chave da OpenAI configurada
            if (!process.env.OPENAI_API_KEY) {
                console.warn("[AIOrchestrator] OpenAI API Key não encontrada no .env. Fallback impossível.");
                return { text: "⚠️ O serviço principal (Gemini) está temporariamente indisponível e não há chave reserva (OpenAI) configurada. Por favor, verifique seu faturamento ou tente mais tarde." };
            }

            console.log("[AIOrchestrator] Iniciando Fallback Automático para OpenAI (gpt-4o-mini)...");
            try {
                // Chamamos a implementação REAL da OpenAI (que vamos refatorar a seguir)
                return await OpenAIService.generateChatResponseReal(systemInstruction, history, message, "gpt-4o-mini", tools);
            } catch (openAiError: any) {
                console.error("[AIOrchestrator] Falha Crítica: Ambos os provedores de IA falharam.", openAiError.message);
                return { text: "❌ Todos os motores de IA estão indisponíveis no momento. Por favor, verifique as chaves API e os limites de cota no seu painel administrativo." };
            }
        }
    }
}
