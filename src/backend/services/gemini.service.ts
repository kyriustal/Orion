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
            // Utilizamos gemini-1.5-flash pela alta estabilidade e generosa cota gratuita no tier padrão da API
            const chat = ai.chats.create({
                model: "gemini-1.5-flash",
                config: {
                    systemInstruction,
                    temperature: 0.1, // Temperatura ultrabaixa para forçar a IA a ater-se APENAS aos documentos e evitar alucinações de serviços
                    topK: 10,
                    topP: 0.8,
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
            console.error("[GeminiService] Error generating response:", error);
            // Proteção contra Rate Limits da Google
            if (error?.status === 429 || error?.message?.includes("Quota exceeded") || error?.message?.includes("429")) {
                return { text: "⚠️ Desculpe, estou recebendo um volume muito alto de mensagens no momento. Por favor, aguarde alguns instantes e tente novamente, ou peça para falar com um atendente humano." };
            }
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
        } catch (error) {
            console.error("[GeminiService] Error generating embeddings:", error);
            throw error;
        }
    }
}
