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
            // Revertendo para o modelo 2.0 que funcionou anteriormente, 
            // gemini-1.5-flash está retornando 404 em alguns contextos beta do SDK @google/genai
            const chat = ai.chats.create({
                model: "gemini-2.0-flash",
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

            const errMsg = error?.message || "";
            // Lançamos o erro para que o AIOrchestrator possa capturar e tentar o fallback
            // se for erro de cota (429) ou chave (400) ou indisponibilidade (404/500/503)
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
