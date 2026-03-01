import { GoogleGenAI } from "@google/genai";

export class GeminiService {
    private static ai: GoogleGenAI | null = null;

    static getClient(): GoogleGenAI {
        if (!this.ai) {
            this.ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY || ""
            });
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
            const chat = ai.chats.create({
                model: "gemini-2.0-flash",
                config: {
                    systemInstruction,
                    temperature: 0.2,
                    tools: tools.length > 0 ? tools : undefined
                },
                history: history
            });

            const response = await chat.sendMessage({ message });

            if (response.functionCalls && response.functionCalls.length > 0) {
                return {
                    text: response.text || "",
                    functionCalls: response.functionCalls
                };
            }

            return { text: response.text || "" };
        } catch (error: any) {
            console.error("[GeminiService] Error:", error.message);
            throw error;
        }
    }

    static async generateEmbeddings(text: string): Promise<number[]> {
        const ai = this.getClient();
        try {
            const response = await ai.models.embedContent({
                model: 'text-embedding-004',
                contents: text,
            });
            return response.embeddings?.[0]?.values || [];
        } catch (error: any) {
            console.error("[GeminiService] Embedding Error:", error.message);
            throw error;
        }
    }
}
