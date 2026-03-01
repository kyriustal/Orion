import { Router } from 'express';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { getSupabase } from '../services/supabase.service';

export const agentRouter = Router();

// Initialize Gemini API with the provided key
const apiKey = (process.env.GEMINI_API_KEY || "AIzaSyAwIN4X0wQkNQi8BdIyRfQ_FCgY1JmFzoM").trim();
console.log(`[GEMINI INIT] API key status: ${apiKey ? `present (starts with ${apiKey.substring(0, 5)}...)` : 'MISSING'}`);
const ai = new GoogleGenAI({ apiKey });

const transferToHumanDeclaration: FunctionDeclaration = {
  name: "transferToHuman",
  description: "Transfere a conversa para um atendente humano. Acione APENAS quando o cliente solicitar explicitamente, apresentar frustração grave, ou o problema for sensível e estiver além da capacidade da IA.",
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

// GET /api/agent/config
agentRouter.get('/config', async (req, res) => {
  res.json({
    system_prompt: 'Você é o ORION, um assistente virtual de elite.',
    ai_model: 'gemini-1.5-flash',
    temperature: 0.1
  });
});

// POST /api/agent/config
agentRouter.post('/config', async (req, res) => {
  res.json({ message: 'Comportamento do Agente atualizado com sucesso.' });
});

// POST /api/agent/knowledge - RAG Upload (legacy redirect)
agentRouter.post('/knowledge', async (req, res) => {
  res.status(501).json({ message: 'Use /api/knowledge/upload para enviar documentos.' });
});

// POST /api/agent/simulate - Simular conversa com a IA
agentRouter.post('/simulate', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Mensagem é obrigatória" });
    }

    // 1. Load company knowledge base from Supabase
    const orgId = (req as any).user?.org_id || "00000000-0000-0000-0000-000000000000";
    const supabase = getSupabase();
    let knowledgeContext = "";

    try {
      const { data: docs } = await supabase
        .from('knowledge_documents')
        .select('content, original_name')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (docs && docs.length > 0) {
        knowledgeContext = docs.map((d: any) =>
          `--- Documento: ${d.original_name} ---\n${d.content}`
        ).join('\n\n');
        console.log(`[RAG] Loaded ${docs.length} document(s) for org ${orgId}`);
      }
    } catch (kbError) {
      console.warn('[RAG] Could not load knowledge base:', kbError);
    }

    // 2. Build premium system instruction
    const systemInstruction = `Você é o ORION, um Agente de Inteligência Artificial de elite, projetado para atendimento ao cliente de alta performance.

REGRAS DE OURO (inegociáveis):
1. *CLAREZA*: Respostas precisas, diretas e sem redundâncias. Cada palavra tem valor.
2. *FORMATO WhatsApp*: Use apenas markdown nativo do WhatsApp: *negrito*, _itálico_, listas com •. Nunca use HTML ou # cabeçalhos Markdown.
3. *TOM*: Profissional, acolhedor e humano. Como um gerente de contas de alto nível.
4. *CONTEXTO ANGOLA*: A moeda é Kwanza (Kz). Frete grátis aplica-se a compras acima de 30.000 Kz fora de Luanda.
5. *HONESTIDADE*: Se não souber a resposta, diga claramente e ofereça transferir para humano.
6. *TRANSFERÊNCIA*: Acione transferToHuman IMEDIATAMENTE se o cliente pedir, estiver frustrado, ou o problema for sensível.

BASE DE CONHECIMENTO (fonte única de verdade — consulte antes de responder):
${knowledgeContext || "Nenhum documento cadastrado ainda. Responda com informações gerais sobre atendimento ao cliente e a plataforma Orion AI."}`;

    // 3. Format history for Gemini (must alternate user/model, start with user)
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

    // 4. Create chat and send message
    const chat = ai.chats.create({
      model: "gemini-1.5-flash",
      config: {
        systemInstruction,
        temperature: 0.1,
        tools: [{ functionDeclarations: [transferToHumanDeclaration] }]
      },
      history: cleanHistory
    });

    const response = await chat.sendMessage({ message });

    // 5. Handle function calls (transferToHuman)
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "transferToHuman") {
        const reason = call.args?.reason || "Solicitação do cliente";
        console.log(`[TRANSFERÊNCIA] Motivo: ${reason}`);
        return res.json({
          reply: "Compreendo sua situação. Estou *transferindo o seu atendimento* para um dos nossos especialistas humanos agora mesmo.\n\nPor favor, _aguarde um momento_ enquanto te conectamos. 🤝",
          transfer: true,
          reason
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
