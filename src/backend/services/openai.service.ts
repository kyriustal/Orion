export class OpenAIService {
    static async generateChatResponseReal(
        systemInstruction: string,
        history: any[],
        message: string,
        model: string = "gpt-4o-mini"
    ): Promise<{ text: string }> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY não configurada.");

        const messages = [
            { role: "system", content: systemInstruction },
            ...history.map(h => ({
                role: h.role === "model" ? "assistant" : "user",
                content: h.parts[0].text
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
                body: JSON.stringify({ model, messages, temperature: 0.3 })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || response.statusText);
            }

            const data = await response.json();
            return { text: data.choices[0].message.content || "" };
        } catch (error: any) {
            console.error("[OpenAIService] Error:", error.message);
            throw error;
        }
    }
}
