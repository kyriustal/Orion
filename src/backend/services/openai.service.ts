import { GeminiService } from "./gemini.service";
import { FunctionDeclaration } from "@google/genai";

// OpenAIService atua como uma interface adaptadora, 
// redirecionando todas as chamadas "gpt" para o GeminiService (modelo Flash 2.5)
// já que a plataforma decidiu padronizar o uso do Google Gemini para velocidade.
export class OpenAIService {
    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string,
        _model: string = "gpt-4o-mini", // Parâmetro mantido por compatibilidade
        tools: { functionDeclarations: FunctionDeclaration[] }[] = []
    ): Promise<{ text: string; functionCalls?: any[] }> {
        console.log("[OpenAIService Adapter] Redirecionando requisição para Google Gemini 2.5 Flash...");
        return await GeminiService.generateChatResponse(
            systemInstruction,
            history,
            message,
            tools
        );
    }
}
