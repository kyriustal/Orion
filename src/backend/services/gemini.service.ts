import { GoogleGenAI } from "@google/genai";

export class GeminiService {
    private static ai: GoogleGenAI | null = null;

    static getClient(): GoogleGenAI {
        if (!this.ai) {
            this.ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
        }
        return this.ai;
    }

    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string,
        tools: any[] = []
    ): Promise<{ text: string; functionCalls?: any[] }> {
        const ai = this.getClient();
        try {
            // Usando gemini-1.5-flash como fallback mais estável se o 2.0 falhar, 
            // mas mantendo 2.0-flash como padrão se disponível.
            const model = ai.getGenerativeModel({
                model: "gemini-1.5-flash", 
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.2,
                },
                tools: tools.length > 0 ? [{ functionDeclarations: tools }] : undefined
            });

            // Normalizar histórico para o formato do Gemini
            const normalizedHistory = history.map(h => {
                let parts = [];
                if (h.parts) {
                    parts = Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts) }];
                } else if (h.content) {
                    parts = [{ text: String(h.content) }];
                } else {
                    parts = [{ text: "" }];
                }

                return {
                    role: h.role === "assistant" || h.role === "model" ? "model" : "user",
                    parts: parts
                };
            });

            const chat = model.startChat({
                history: normalizedHistory
            });

            const result = await chat.sendMessage(message);
            const response = result.response;
            const text = response.text();

            const calls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);

            if (calls && calls.length > 0) {
                return {
                    text: text || "",
                    functionCalls: calls.map(c => c.functionCall)
                };
            }

            return { text: text || "" };
        } catch (error: any) {
            console.error("[GeminiService] Error:", error.message);
            throw error;
        }
    }

    static async generateEmbeddings(text: string): Promise<number[]> {
        const ai = this.getClient();
        try {
            const model = ai.getGenerativeModel({ model: "text-embedding-004" });
            const result = await model.embedContent(text);
            return result.embedding.values || [];
        } catch (error: any) {
            console.error("[GeminiService] Embedding Error:", error.message);
            throw error;
        }
    }
}
