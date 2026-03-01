// Centralized Gemini Service using robust REST fetch to bypass SDK translation errors

export class GeminiService {
  /**
   * Integração assíncrona com o Gemini mantendo o contexto da conversa e suportando ferramentas
   */
  static async generateChatResponse(
    systemPrompt: string,
    history: { role: string; parts: { text: string }[] }[],
    newMessage: string,
    model: string = 'gemini-2.0-flash',
    tools: any[] = []
  ) {
    try {
      const apiKey = (process.env.GEMINI_API_KEY || "").trim();
      if (!apiKey) {
        throw new Error("API key is missing");
      }

      // Format payload exactly as the v1beta REST API expects it
      const contents = [...history, { role: "user", parts: [{ text: newMessage }] }];

      const payload: any = {
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.1 },
      };

      if (tools && tools.length > 0) {
        payload.tools = tools;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`[Gemini REST Error] ${response.status}: ${text}`);
        throw new Error(`Gemini API Error: ${response.status} - ${text}`);
      }

      const data = await response.json();
      const firstCandidate = data.candidates?.[0];

      const functionCallPart = firstCandidate?.content?.parts?.find((p: any) => p.functionCall);
      const textPart = firstCandidate?.content?.parts?.find((p: any) => p.text);

      return {
        text: textPart?.text || "",
        functionCalls: functionCallPart ? [functionCallPart.functionCall] : []
      };

    } catch (error: any) {
      console.error('[Gemini Service Error]', error.message || error);
      throw error;
    }
  }

  // Backwards compatibility for the old generateResponse method
  static async generateResponse(
    systemPrompt: string,
    history: { role: string, content: string }[],
    newMessage: string,
    model: string = 'gemini-2.0-flash'
  ) {
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const result = await this.generateChatResponse(systemPrompt, formattedHistory, newMessage, model);
    return result.text;
  }
}

