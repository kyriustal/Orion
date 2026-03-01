import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export class GeminiService {
    private static ai: GoogleGenAI | null = null;

    static getClient(): GoogleGenAI {
        if (!this.ai) {
            this.ai = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY || "AIzaSyAwIN4X0wQkNQi8BdIyRfQ_FCgY1JmFzoM"
            });
        }
        return this.ai;
    }

    static async generateChatResponse(
        systemInstruction: string,
        history: any[],
        message: string,
        tools: { functionDeclarations: FunctionDeclaration[] }[] = []
    ): Promise<{ text: string; functionCalls?: any[] }> {
        const ai = this.getClient();

        try {
            const chat = ai.chats.create({
                model: "gemini-2.5-flash",
                config: {
                    systemInstruction,
                    temperature: 0.3,
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
        } catch (error) {
            console.error("[GeminiService] Error generating response:", error);
            throw error;
        }
    }
}
