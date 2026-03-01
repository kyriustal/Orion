import { GeminiService } from "./gemini.service";
import { FunctionDeclaration } from "@google/genai";

// OpenAIService atua como uma interface adaptadora, 
// redirecionando todas as chamadas "gpt" para o GeminiService (modelo Flash 1.5)
// já que a plataforma padronizou o uso do Google Gemini pela cota free e velocidade multimodais.
export class OpenAIService {
    /**
     * Implementação REAL da OpenAI para ser usada como Fallback.
     */
    static async generateChatResponseReal(
        systemInstruction: string,
        history: any[],
        message: string,
        model: string = "gpt-4o-mini",
        tools: { functionDeclarations: FunctionDeclaration[] }[] = []
    ): Promise<{ text: string; functionCalls?: any[] }> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");

        // Converter histórico do formato Gemini para o formato OpenAI
        const messages = [
            { role: "system", content: systemInstruction },
            ...history.map(h => ({
                role: h.role === "model" ? "assistant" : "user",
                content: typeof h.parts[0].text === 'string' ? h.parts[0].text : JSON.stringify(h.parts[0])
            })),
            { role: "user", content: message }
        ];

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.3,
                    // Por simplicidade inicial, omitimos ferramentas complexas, 
                    // mas mantemos a assinatura compatível.
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const choice = data.choices[0];

            return {
                text: choice.message.content || ""
            };
        } catch (error: any) {
            console.error("[OpenAIService] Real API Error:", error.message);
            throw error;
        }
    }
}
