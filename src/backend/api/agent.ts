import { Router } from 'express';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

export const agentRouter = Router();

// Initialize Gemini API with the provided key
const apiKey = (process.env.GEMINI_API_KEY || "AIzaSyAwIN4X0wQkNQi8BdIyRfQ_FCgY1JmFzoM").trim();
console.log(`[GEMINI INIT] API key status: ${apiKey ? `present (starts with ${apiKey.substring(0, 5)}...)` : 'MISSING'}`);
const ai = new GoogleGenAI({ apiKey });

const transferToHumanDeclaration: FunctionDeclaration = {
  name: "transferToHuman",
  description: "Transfere a conversa para um atendente humano. Use esta função APENAS quando o cliente solicitar explicitamente para falar com um humano, ou quando apresentar um problema sensível, reclamação grave ou situação que a IA não consiga resolver.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: "O motivo pelo qual a conversa está sendo transferida para um humano."
      }
    },
    required: ["reason"]
  }
};

// GET /api/agent/config - Obter prompt e modelo atual
agentRouter.get('/config', async (req, res) => {
  const orgId = req.user?.org_id;

  // TODO: Buscar da tabela whatsapp_configs e subscription_plans
  res.json({
    system_prompt: 'Você é um assistente virtual de vendas. Seja educado e conciso.',
    ai_model: 'gemini-1.5-flash',
    temperature: 0.3
  });
});

// POST /api/agent/config - Atualizar comportamento da IA
agentRouter.post('/config', async (req, res) => {
  const orgId = req.user?.org_id;
  const { system_prompt, ai_model } = req.body;

  // TODO: Atualizar no banco de dados
  res.json({ message: 'Comportamento do Agente atualizado com sucesso.' });
});

// POST /api/agent/knowledge - Fazer upload de documentos para RAG (Futuro)
agentRouter.post('/knowledge', async (req, res) => {
  // TODO: Receber PDF/TXT, gerar embeddings com Gemini e salvar no pgvector
  res.status(501).json({ message: 'Funcionalidade de RAG em desenvolvimento.' });
});

// POST /api/agent/simulate - Simular conversa com a IA
agentRouter.post('/simulate', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem é obrigatória" });
    }

    // Format history for Gemini (must start with user and alternate)
    const rawHistory = history ? history.map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })) : [];

    const cleanHistory: any[] = [];
    let currentRole = '';
    let currentParts: any[] = [];

    for (const msg of rawHistory) {
      if (msg.role !== currentRole) {
        if (currentRole !== '') {
          cleanHistory.push({ role: currentRole, parts: currentParts });
        }
        currentRole = msg.role;
        currentParts = [...msg.parts];
      } else {
        currentParts.push({ text: '\n\n' });
        currentParts.push(...msg.parts);
      }
    }
    if (currentRole !== '') {
      cleanHistory.push({ role: currentRole, parts: currentParts });
    }

    // Ensure history starts with 'user'
    if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
      cleanHistory.shift();
    }

    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
      config: {
        systemInstruction: `Você é o Orion, um Agente de Inteligência Artificial de elite, extremamente inteligente, conciso e profissional.
DIRETRIZES FUNDAMENTAIS:
1. TEXTO LIMPO: Jamais use ruídos, símbolos repetitivos ou caracteres desnecessários. Suas respostas devem ser esteticamente organizadas.
2. ESTRUTURA: Use Markdowns. *Negrito* para pontos importantes e listas para organização.
3. ESTILO: Responda de forma direta e humana. Evite introduções longas.
4. CONTEXTO ANGOLA: Atuamos com foco no mercado de Angola. A moeda é Kwanza (Kz). 
   - REGRA DE FRETE: O Frete Grátis para fora de Luanda aplica-se automaticamente para compras acima de 30.000 Kz.
5. FERRAMENTA transferToHuman: Acione IMEDIATAMENTE se o cliente pedir falar com um humano acompanhado de um motivo válido.

Se o cliente estiver irritado, apresentar um problema sensível ou pedir para falar com um humano, você DEVE usar a ferramenta transferToHuman para transferir o atendimento.`,
        temperature: 0.1,
        tools: [{ functionDeclarations: [transferToHumanDeclaration] }]
      },
      history: cleanHistory
    });

    const response = await chat.sendMessage({ message });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "transferToHuman") {
        const reason = call.args?.reason || "Solicitação do cliente";
        console.log(`[ALERTA SECRETARIA] Transferência solicitada na simulação. Motivo: ${reason}`);
        return res.json({
          reply: "Compreendo a situação. Estou transferindo o seu atendimento para um de nossos especialistas humanos. Por favor, aguarde um momento enquanto notifico a nossa secretaria.",
          transfer: true,
          reason: reason
        });
      }
    }

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Erro na simulação do Gemini:", error);
    res.status(500).json({
      error: "Erro ao processar a mensagem com a IA.",
      details: error.message,
      code: error.status || "GEMINI_ERROR"
    });
  }
});
