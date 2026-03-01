// Centralized OpenAI Service using robust REST fetch

export class OpenAIService {
    /**
     * Integração assíncrona com a OpenAI mantendo o contexto da conversa e suportando ferramentas
     */
    static async generateChatResponse(
        systemPrompt: string,
        history: { role: string; parts: { text: string }[] }[],
        newMessage: string,
        model: string = 'gpt-4o-mini',
        tools: any[] = []
    ) {
        try {
            const apiKey = (process.env.OPENAI_API_KEY || "").trim();
            if (!apiKey) {
                throw new Error("OpenAI API key is missing");
            }

            // Format payload exactly as the OpenAI REST API expects it
            // History in Gemini was { role, parts: [{ text }] }, OpenAI expects { role, content }
            const formattedHistory = history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : msg.role,
                content: msg.parts.map(p => p.text).join('\n')
            }));

            const messages = [
                { role: 'system', content: systemPrompt },
                ...formattedHistory,
                { role: 'user', content: newMessage }
            ];

            const payload: any = {
                model: model,
                messages: messages,
                temperature: 0.1,
            };

            // Transform Gemini tool declarations to OpenAI tool format if necessary
            if (tools && tools.length > 0) {
                payload.tools = tools.flatMap(t =>
                    (t.functionDeclarations || []).map((func: any) => ({
                        type: "function",
                        function: {
                            name: func.name,
                            description: func.description,
                            parameters: {
                                type: "object",
                                properties: func.parameters?.properties || {},
                                required: func.parameters?.required || []
                            }
                        }
                    }))
                );
            }

            const url = `https://api.openai.com/v1/chat/completions`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[OpenAI REST Error] ${response.status}:`, errorData);
                throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown Error'}`);
            }

            const data = await response.json();
            const firstChoice = data.choices?.[0];
            const message = firstChoice?.message;

            let functionCalls: any[] = [];
            if (message?.tool_calls && message.tool_calls.length > 0) {
                functionCalls = message.tool_calls.map((tc: any) => ({
                    name: tc.function.name,
                    args: JSON.parse(tc.function.arguments || "{}")
                }));
            }

            return {
                text: message?.content || "",
                functionCalls: functionCalls
            };

        } catch (error: any) {
            console.error('[OpenAI Service Error]', error.message || error);
            throw error;
        }
    }

    // Backwards compatibility for simpler cases
    static async generateResponse(
        systemPrompt: string,
        history: { role: string, content: string }[],
        newMessage: string,
        model: string = 'gpt-4o-mini'
    ) {
        const formattedHistory = history.map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        const result = await this.generateChatResponse(systemPrompt, formattedHistory, newMessage, model);
        return result.text;
    }
}
