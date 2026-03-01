import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { OpenAIService } from '../services/openai.service';
import { Type } from '@google/genai';

export const agentRouter = Router();
const transferToHumanDeclaration = {
  functionDeclarations: [
    {
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
    }
  ]
};

// GET /api/agent/config
agentRouter.get('/config', async (req, res) => {
  res.json({
    system_prompt: 'Você é o ORION, um assistente virtual de elite.',
    ai_model: 'gemini-2.0-flash',
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

    // 1.5 Load Agent persona (Display Name inside WhatsApp Configs)
    let agentName = "ORION";
    let agentDescription = "um Agente de Inteligência Artificial de elite, projetado para atendimento ao cliente de alta performance.";

    try {
      const { data: config } = await supabase
        .from('whatsapp_configs')
        .select('display_name, description')
        .eq('organizations_id', orgId)
        .single();

      if (config) {
        if (config.display_name) agentName = config.display_name;
        if (config.description) agentDescription = config.description;
      }
    } catch (confError) {
      console.warn('[AGENT CONFIG] Could not load custom persona:', confError);
    }

    // 2. Build premium system instruction
    const systemInstruction = `Você é ${agentName}, ${agentDescription}

REGRAS DE OURO (inegociáveis):
1. *CLAREZA*: Respostas precisas, diretas e sem redundâncias. Responda ESTRITAMENTE sobre os serviços estipulados na Base de Conhecimento abaixo. NUNCA invente preços ou localizações.
2. *FORMATO WhatsApp*: Use apenas markdown nativo do WhatsApp: *negrito*, _itálico_, listas com •. Nunca use HTML ou # cabeçalhos Markdown.
3. *TOM*: Profissional, acolhedor e como se você realmente estivesse na empresa ${agentName}.
4. *CONTEXTO ANGOLA*: A moeda é Kwanza (Kz). 
5. *HONESTIDADE*: Se a resposta NÃO estiver na Base de Conhecimento abaixo, Diga claramente e ofereça transferência ao invés de alucinar informações.
6. *TRANSFERÊNCIA*: Acione transferToHuman IMEDIATAMENTE se o cliente pedir para falar com suporte/atendente humano.

BASE DE CONHECIMENTO DA EMPRESA (fonte única de verdade — ATENHA-SE A ISTO):
------------------------------------------------------
${knowledgeContext || "Nenhum documento cadastrado ainda pela empresa. Avise o cliente que os dados internos ainda não foram sincronizados e pergunte se quer ajuda de um humano."}
------------------------------------------------------`;

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

    // 4. Create chat and send message using our centralized REST fetch service
    const response = await OpenAIService.generateChatResponse(
      systemInstruction,
      cleanHistory,
      message,
      "gpt-4o-mini",
      [transferToHumanDeclaration]
    );

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
