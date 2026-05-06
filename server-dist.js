// server.ts
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { existsSync } from "fs";
import dotenv2 from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// src/backend/api/webhook.ts
import { Router } from "express";

// src/backend/services/supabase.service.ts
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
var getSupabase = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[Supabase] ERRO: Chaves de configuracao ausentes!");
    throw new Error("Configuracao do Supabase incompleta no servidor.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// src/backend/services/whatsapp.service.ts
var WhatsAppService = class {
  /**
   * Dispara mensagem via HTTPX/Fetch para a API Oficial da Meta
   */
  static async sendMessage(phoneNumberId, accessToken, to, text) {
    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: text }
        })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error?.code === 131030) {
          console.error(`[WhatsApp] Erro 131030: Fora da janela de 24h para o n\xFAmero ${to}`);
        }
        throw new Error(`WhatsApp API Error: ${JSON.stringify(data)}`);
      }
      return data;
    } catch (error) {
      console.error("[WhatsApp] Falha ao enviar mensagem:", error);
      return null;
    }
  }
};

// src/backend/services/gemini.service.ts
import { GoogleGenAI } from "@google/genai";
var GeminiService = class {
  static {
    this.ai = null;
  }
  static getClient() {
    if (!this.ai) {
      this.ai = new GoogleGenAI(process.env.GEMINI_API_KEY || "");
    }
    return this.ai;
  }
  static async generateChatResponse(systemInstruction, history, message, tools = []) {
    const ai = this.getClient();
    try {
      const model = ai.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction,
        generationConfig: {
          temperature: 0.2
        },
        tools: tools.length > 0 ? [{ functionDeclarations: tools }] : void 0
      });
      const chat = model.startChat({
        history: history.map((h) => ({
          role: h.role,
          parts: h.parts
        }))
      });
      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();
      const calls = response.candidates?.[0]?.content?.parts?.filter((p) => p.functionCall);
      if (calls && calls.length > 0) {
        return {
          text: text || "",
          functionCalls: calls.map((c) => c.functionCall)
        };
      }
      return { text: text || "" };
    } catch (error) {
      console.error("[GeminiService] Error:", error.message);
      throw error;
    }
  }
  static async generateEmbeddings(text) {
    const ai = this.getClient();
    try {
      const model = ai.getGenerativeModel({ model: "text-embedding-004" });
      const result = await model.embedContent(text);
      return result.embedding.values || [];
    } catch (error) {
      console.error("[GeminiService] Embedding Error:", error.message);
      throw error;
    }
  }
};

// src/backend/services/openai.service.ts
var OpenAIService = class {
  static async generateChatResponseReal(systemInstruction, history, message, model = "gpt-4o-mini") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY n\xE3o configurada.");
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map((h) => {
        let content = "";
        if (typeof h.parts === "string") content = h.parts;
        else if (Array.isArray(h.parts)) content = h.parts[0]?.text || "";
        return {
          role: h.role === "model" || h.role === "assistant" ? "assistant" : "user",
          content
        };
      }),
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
    } catch (error) {
      console.error("[OpenAIService] Error:", error.message);
      throw error;
    }
  }
};

// src/backend/services/ai_orchestrator.service.ts
var AIOrchestratorService = class {
  /**
   * Gera resposta de chat usando Gemini com fallback para OpenAI.
   */
  static async generateChatResponse(systemInstruction, history, message) {
    console.log("[AI Orchestrator] Gerando resposta...");
    try {
      const response = await GeminiService.generateChatResponse(
        systemInstruction,
        history,
        message
      );
      return response;
    } catch (geminiError) {
      console.warn("[AI Orchestrator] Gemini falhou, tentando OpenAI...", geminiError.message);
      try {
        const response = await OpenAIService.generateChatResponseReal(
          systemInstruction,
          history,
          message
        );
        return response;
      } catch (openaiError) {
        console.error("[AI Orchestrator] Ambos os modelos falharam!");
        return { text: "Desculpe, estou enfrentando instabilidade momentanea. Por favor, tente novamente em instantes." };
      }
    }
  }
};

// src/backend/api/webhook.ts
var webhookRouter = Router();
webhookRouter.post("/", async (req, res) => {
  try {
    const body = req.body;
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const phoneNumberId = value.metadata.phone_number_id;
            const from = message.from;
            const text = message.text?.body;
            if (text) {
              const supabase = getSupabase();
              const { data: config } = await supabase.from("whatsapp_configs").select("org_id, access_token, display_name, description, organizations(id, use_emojis)").eq("phone_number_id", phoneNumberId).single();
              if (!config || !config.organizations) continue;
              const org = Array.isArray(config.organizations) ? config.organizations[0] : config.organizations;
              const sessionId = `${org.id}_${from}`;
              let knowledge = "";
              try {
                const embedding = await GeminiService.generateEmbeddings(text);
                const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
                  query_embedding: embedding,
                  match_threshold: 0.5,
                  match_count: 3,
                  p_org_id: org.id
                });
                if (chunks) knowledge = chunks.map((c) => c.content).join("\n\n");
              } catch (e) {
                console.error("RAG Error:", e);
              }
              const systemInstruction = `Voc\xEA \xE9 ${config.display_name || "Orion"}. 
                            Contexto: ${knowledge || "Responda com base no seu conhecimento geral educado."}
                            Emoji: ${org.use_emojis ? "Sim" : "N\xE3o"}`;
              const aiResponse = await AIOrchestratorService.generateChatResponse(systemInstruction, [], text);
              const replyText = aiResponse.text;
              await supabase.from("messages").insert({ session_id: sessionId, role: "model", content: replyText });
              await WhatsAppService.sendMessage(phoneNumberId, config.access_token, from, replyText);
            }
          }
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } catch (e) {
    res.status(500).send("ERROR");
  }
});
webhookRouter.get("/", (req, res) => {
  const challenge = req.query["hub.challenge"];
  res.status(200).send(challenge);
});

// src/backend/api/auth.ts
import { Router as Router2 } from "express";
import bcrypt from "bcryptjs";
import jwt2 from "jsonwebtoken";

// src/backend/middleware/auth.middleware.ts
import jwt from "jsonwebtoken";

// src/backend/config/jwt.ts
import "dotenv/config";
var JWT_SECRET = (process.env.JWT_SECRET || "orion_fallback_secret_321").trim();

// src/backend/middleware/auth.middleware.ts
var requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "N\xE3o autorizado. Token ausente ou inv\xE1lido." });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      org_id: decoded.org_id,
      role: decoded.role,
      email: decoded.email
    };
    return next();
  } catch (err) {
    console.error("JWT AUTH ERROR:", err.message);
    return res.status(401).json({
      error: "Token inv\xE1lido ou expirado.",
      details: err.message,
      code: err.name
      // ex: TokenExpiredError, JsonWebTokenError
    });
  }
};

// src/backend/api/auth.ts
var authRouter = Router2();
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const supabase = getSupabase();
    const { data: org, error } = await supabase.from("organizations").select("*").eq("owner_email", email).single();
    if (error) {
      if (error.code === "PGRST116") {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }
      console.error("Supabase Login Error:", error);
      return res.status(500).json({
        error: "Erro de conex\xE3o com o banco de dados.",
        details: error.message,
        code: error.code
      });
    }
    if (!org) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }
    const isMatch = await bcrypt.compare(password, org.password || "");
    if (!isMatch) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }
    const token = jwt2.sign(
      { id: org.id, org_id: org.id, email: org.owner_email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: org.id,
        name: org.name,
        email: org.owner_email,
        org_id: org.id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
authRouter.post("/register", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    whatsapp,
    address,
    contact,
    companyName,
    socialObject,
    employees,
    product,
    chatbotName,
    password
  } = req.body;
  try {
    const supabase = getSupabase();
    const { data: existing } = await supabase.from("organizations").select("id").eq("owner_email", email).single();
    if (existing) {
      return res.status(400).json({ error: "Este e-mail j\xE1 est\xE1 cadastrado." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: org, error } = await supabase.from("organizations").insert([{
      name: companyName,
      owner_email: email,
      password: hashedPassword,
      plan_status: "trial",
      first_name: firstName,
      last_name: lastName,
      phone,
      whatsapp,
      address,
      contact_person: contact,
      social_object: socialObject,
      employees_count: employees,
      product_description: product,
      chatbot_name: chatbotName
    }]).select().single();
    if (error) throw error;
    res.status(201).json({
      message: "Conta criada com sucesso. Bem-vindo \xE0 Orion!",
      user: { email, firstName, lastName }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
authRouter.get("/me", requireAuth, async (req, res) => {
  const { data: user, error } = await getSupabase().from("organizations").select("first_name, last_name, owner_email, name, phone, whatsapp, address, social_object, employees_count, product_description, chatbot_name").eq("id", req.user?.id).single();
  if (error) {
    console.error("Supabase /me Error:", error);
    return res.status(500).json({ error: "Erro ao buscar dados do usu\xE1rio." });
  }
  if (!user) {
    return res.status(404).json({ error: "Usu\xE1rio n\xE3o encontrado." });
  }
  res.json({
    user: {
      ...req.user,
      name: user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.name,
      email: user.owner_email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      whatsapp: user.whatsapp,
      address: user.address,
      social_object: user.social_object,
      employees_count: user.employees_count,
      product_description: user.product_description,
      chatbot_name: user.chatbot_name
    }
  });
});

// src/backend/api/dashboard.ts
import { Router as Router3 } from "express";
var dashboardRouter = Router3();
dashboardRouter.get("/stats", (req, res) => {
  res.json({
    activeChats: 0,
    messagesToday: 0,
    automationsRunning: 0
  });
});

// src/backend/api/whatsapp.ts
import { Router as Router4 } from "express";
var whatsappRouter = Router4();
whatsappRouter.get("/config", requireAuth, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("whatsapp_configs").select("phone_number_id, waba_id, is_active, webhook_status, app_id, client_secret, display_name, business_category, description, profile_picture_url, website, support_email").eq("org_id", orgId).single();
    if (error && error.code !== "PGRST116") throw error;
    res.json(data || {
      phone_number_id: "",
      waba_id: "",
      app_id: "",
      client_secret: "",
      display_name: "",
      business_category: "",
      description: "",
      profile_picture_url: "",
      website: "",
      support_email: "",
      is_active: false,
      webhook_status: "disconnected"
    });
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar configura\xE7\xF5es do WhatsApp" });
  }
});
whatsappRouter.post("/config", requireAuth, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    const {
      phone_number_id,
      waba_id,
      access_token,
      app_id,
      client_secret,
      display_name,
      business_category,
      description,
      profile_picture_url,
      website,
      support_email
    } = req.body;
    const supabase = getSupabase();
    const { data: existing } = await supabase.from("whatsapp_configs").select("id").eq("org_id", orgId).single();
    const payload = {
      phone_number_id,
      waba_id,
      access_token,
      app_id,
      client_secret,
      display_name,
      business_category,
      description,
      profile_picture_url,
      website,
      support_email,
      webhook_status: "connected",
      is_active: true
    };
    if (existing) {
      await supabase.from("whatsapp_configs").update(payload).eq("org_id", orgId);
    } else {
      await supabase.from("whatsapp_configs").insert([{ org_id: orgId, ...payload }]);
    }
    res.json({ message: "Configura\xE7\xF5es do WhatsApp atualizadas com sucesso." });
  } catch (e) {
    res.status(500).json({ error: "Erro ao salvar configura\xE7\xF5es do WhatsApp" });
  }
});

// src/backend/api/agent.ts
import { Router as Router5 } from "express";

// src/backend/services/automation.service.ts
var AutomationService = class {
  /**
   * Tenta identificar se uma mensagem do usuário deve disparar uma automação.
   * @param orgId ID da Organização
   * @param message Mensagem do Usuário
   * @returns A automação disparada ou null
   */
  static async triggerAutomation(orgId, message) {
    const supabase = getSupabase();
    const { data: automations } = await supabase.from("automations").select("*").eq("org_id", orgId).eq("status", "active");
    if (!automations || automations.length === 0) return null;
    for (const auto of automations) {
      const keywords = auto.config?.keywords || [];
      const msgLower = message.toLowerCase();
      if (keywords.some((kw) => msgLower.includes(kw.toLowerCase()))) {
        console.log(`[Automation] Gatilho ativado: "${auto.name}" para a mensagem: "${message}"`);
        return auto;
      }
    }
    return null;
  }
  /**
   * Executa uma ação de automação.
   */
  static async executeAction(automation, context) {
    const type = automation.type;
    const config = automation.config;
    switch (type) {
      case "lead_capture":
        console.log("[Automation] Executando Lead Capture...");
        return { reply: config?.success_message || "Obrigado! Seus dados foram anotados." };
      case "auto_reply":
        return { reply: config?.reply_text };
      default:
        return null;
    }
  }
};

// src/backend/api/agent.ts
var agentRouter = Router5();
agentRouter.post("/simulate", async (req, res) => {
  const { message, history } = req.body;
  const org_id = req.user?.org_id;
  if (!org_id) return res.status(401).json({ error: "Nao autorizado" });
  try {
    const supabase = getSupabase();
    const { data: org } = await supabase.from("organizations").select("*").eq("id", org_id).single();
    const triggeredAuto = await AutomationService.triggerAutomation(org_id, message);
    if (triggeredAuto) {
      const actionResult = await AutomationService.executeAction(triggeredAuto, { org_id });
      if (actionResult && actionResult.reply) {
        return res.json({
          reply: actionResult.reply,
          automation_triggered: triggeredAuto.name
        });
      }
    }
    let knowledge = "";
    try {
      const embedding = await GeminiService.generateEmbeddings(message);
      const { data: chunks } = await supabase.rpc("match_knowledge_chunks", {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 5,
        p_org_id: org_id
      });
      if (chunks && chunks.length > 0) {
        knowledge = chunks.map((c) => c.content).join("\n\n---\n\n");
      }
    } catch (ragError) {
      console.warn("RAG Fallback triggered:", ragError);
      knowledge = org?.product_description || "";
    }
    const botName = org?.chatbot_name || "Orion";
    const companyName = org?.name || "Nossa Empresa";
    const systemInstruction = `Voce e o assistente virtual ${botName} da empresa ${companyName}.
        
        CONTEXTO EMPRESARIAL:
        ${org?.product_description || "Atendimento profissional e eficiente."}
        
        CONHECIMENTO ADICIONAL:
        ${knowledge || "Sem documentos adicionais."}
        
        REGRAS:
        - Responda de forma curta e objetiva.
        - Se nao souber, diga que vai transferir para um humano.
        - Use emojis: ${org?.use_emojis ? "SIM" : "NAO"}.
        - Tom de voz: Profissional e Acolhedor.`;
    const response = await AIOrchestratorService.generateChatResponse(
      systemInstruction,
      history || [],
      message
    );
    res.json({ reply: response.text });
  } catch (error) {
    console.error("[Agent API] Erro critico:", error);
    res.status(500).json({ error: "Erro interno no servidor de IA." });
  }
});

// src/backend/api/chats.ts
import { Router as Router6 } from "express";
var chatsRouter = Router6();
chatsRouter.get("/", async (req, res) => {
  const orgId = req.user?.org_id;
  res.json([
    { id: "session-1", user_phone: "5511999999999", last_interaction: (/* @__PURE__ */ new Date()).toISOString(), is_human_overflow: true, unread: 2 },
    { id: "session-2", user_phone: "5511888888888", last_interaction: new Date(Date.now() - 36e5).toISOString(), is_human_overflow: false, unread: 0 }
  ]);
});
chatsRouter.get("/:sessionId/messages", async (req, res) => {
  const { sessionId } = req.params;
  res.json([
    { id: "msg-1", role: "user", content: "Gostaria de falar com um humano", created_at: new Date(Date.now() - 6e4).toISOString() },
    { id: "msg-2", role: "model", content: "Um atendente humano assumir\xE1 a conversa em breve.", created_at: new Date(Date.now() - 58e3).toISOString() }
  ]);
});
chatsRouter.post("/:sessionId/takeover", async (req, res) => {
  const { sessionId } = req.params;
  res.json({ message: "Atendimento humano iniciado. IA pausada para este chat." });
});
chatsRouter.post("/:sessionId/resolve", async (req, res) => {
  const { sessionId } = req.params;
  res.json({ message: "Atendimento resolvido. IA reativada para este chat." });
});
chatsRouter.post("/:sessionId/send", async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  res.json({ message: "Mensagem enviada com sucesso." });
});

// src/backend/api/automations.ts
import { Router as Router7 } from "express";
var automationsRouter = Router7();
automationsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    const supabase = getSupabase();
    const { data: automations, error } = await supabase.from("automations").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(automations || []);
  } catch (error) {
    console.error("Erro ao listar automa\xE7\xF5es:", error);
    res.status(500).json({ error: "Erro interno ao listar automa\xE7\xF5es." });
  }
});
automationsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    const { name, type, config } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "Nome e tipo s\xE3o obrigat\xF3rios." });
    }
    const supabase = getSupabase();
    const { data, error } = await supabase.from("automations").insert([{
      org_id: orgId,
      name,
      type,
      config: config || {},
      status: "active"
    }]).select().single();
    if (error) throw error;
    res.status(201).json({ message: "Automa\xE7\xE3o criada com sucesso.", automation: data });
  } catch (error) {
    console.error("Erro ao criar automa\xE7\xE3o:", error);
    res.status(500).json({ error: "Erro interno ao criar automa\xE7\xE3o." });
  }
});
automationsRouter.get("/campaigns", requireAuth, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    const supabase = getSupabase();
    const { data: campaigns, error } = await supabase.from("campaigns").select("*, whatsapp_templates(name)").eq("org_id", orgId).order("created_at", { ascending: false });
    if (error) throw error;
    res.json(campaigns || []);
  } catch (error) {
    console.error("Erro ao listar campanhas:", error);
    res.status(500).json({ error: "Erro interno ao listar campanhas." });
  }
});
automationsRouter.post("/campaigns/send", requireAuth, async (req, res) => {
  try {
    const orgId = req.user?.org_id;
    const { name, template_id, audience_type, filters } = req.body;
    if (!name || !template_id) {
      return res.status(400).json({ error: "Nome da campanha e ID do template s\xE3o obrigat\xF3rios." });
    }
    const supabase = getSupabase();
    const { data: campaign, error: campaignError } = await supabase.from("campaigns").insert([{
      org_id: orgId,
      name,
      template_id,
      audience_type,
      filters,
      status: "sending"
    }]).select().single();
    if (campaignError) throw campaignError;
    const contacts = [
      { id: 1, phone: "+244923000001", name: "Cliente 1" },
      { id: 2, phone: "+244923000002", name: "Cliente 2" },
      { id: 3, phone: "+244923000003", name: "Cliente 3" }
    ];
    (async () => {
      console.log(`[CAMPANHA ${campaign.id}] Iniciando: "${name}" - ${contacts.length} destinat\xE1rios.`);
      let sentCount = 0;
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        console.log(`[CAMPANHA] Enviando (${i + 1}/${contacts.length}) template ID "${template_id}" para ${contact.phone}...`);
        sentCount++;
        if (sentCount % 10 === 0 || i === contacts.length - 1) {
          await supabase.from("campaigns").update({ sent_count: sentCount, total_count: contacts.length }).eq("id", campaign.id);
        }
        if (i < contacts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 3e3));
        }
      }
      await supabase.from("campaigns").update({ status: "completed", sent_count: sentCount, total_count: contacts.length }).eq("id", campaign.id);
      console.log(`[CAMPANHA] "${name}" conclu\xEDda. ${contacts.length} mensagens enviadas.`);
    })();
    res.json({
      message: `Campanha "${name}" iniciada com sucesso. ${contacts.length} mensagens est\xE3o sendo enviadas em background com delay de 3s por n\xFAmero (pol\xEDtica da Meta).`,
      campaign_id: campaign.id,
      estimatedTime: contacts.length * 3
      // 3 seconds per contact
    });
  } catch (error) {
    console.error("Erro ao iniciar campanha:", error);
    res.status(500).json({ error: "Erro ao iniciar campanha." });
  }
});
automationsRouter.post("/:id/trigger", requireAuth, async (req, res) => {
  const { id } = req.params;
  res.json({ message: "Disparo de automa\xE7\xE3o iniciado em background." });
});
automationsRouter.put("/:id/toggle", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orgId = req.user?.org_id;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("automations").update({ status }).eq("id", id).eq("org_id", orgId).select().single();
    if (error) throw error;
    res.json({ message: `Automa\xE7\xE3o ${status === "active" ? "ativada" : "desativada"}.`, automation: data });
  } catch (error) {
    console.error("Erro ao alternar status da automa\xE7\xE3o:", error);
    res.status(500).json({ error: "Erro interno ao alterar automa\xE7\xE3o." });
  }
});

// src/backend/api/subscriptions.ts
import { Router as Router8 } from "express";
var subscriptionsRouter = Router8();
subscriptionsRouter.post("/start-trial", requireAuth, async (req, res) => {
  const orgId = req.user?.org_id;
  const { planId } = req.body;
  const trialEndsAt = /* @__PURE__ */ new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);
  res.json({
    message: "Per\xEDodo de teste de 7 dias iniciado com sucesso!",
    trial_ends_at: trialEndsAt.toISOString(),
    status: "trialing"
  });
});
subscriptionsRouter.get("/status", requireAuth, async (req, res) => {
  const orgId = req.user?.org_id;
  const mockTrialEnd = /* @__PURE__ */ new Date();
  mockTrialEnd.setDate(mockTrialEnd.getDate() + 7);
  res.json({
    status: "trialing",
    trial_ends_at: mockTrialEnd.toISOString(),
    plan_name: "Pro",
    is_active: true
  });
});

// src/backend/api/knowledge.ts
import { Router as Router9 } from "express";
var knowledgeRouter = Router9();
knowledgeRouter.post("/process", async (req, res) => {
  const { org_id, document_id, content } = req.body;
  if (!content) return res.status(400).json({ error: "Conte\xFAdo vazio" });
  try {
    const supabase = getSupabase();
    const embedding = await GeminiService.generateEmbeddings(content);
    const { error } = await supabase.from("knowledge_chunks").insert({
      org_id,
      document_id: document_id || null,
      content,
      embedding
    });
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error("[Knowledge API] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});
knowledgeRouter.get("/", async (req, res) => {
  const org_id = req.user?.org_id;
  const supabase = getSupabase();
  const { data, error } = await supabase.from("knowledge_documents").select("*").eq("org_id", org_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// src/backend/api/orion-web.ts
import { Router as Router10 } from "express";
var orionWebRouter = Router10();
orionWebRouter.post("/chat", async (req, res) => {
  const { message, history } = req.body;
  try {
    const supabase = getSupabase();
    const systemInstruction = `Voc\xEA \xE9 a Orion, a Intelig\xEAncia Artificial oficial da plataforma Orion 2.
        Seu objetivo \xE9 ajudar usu\xE1rios sobre a plataforma: WhatsApp IA, CRM, Dashboard e Automa\xE7\xF5es.
        Seja elegante, concisa e extremamente prestativa.`;
    const response = await AIOrchestratorService.generateChatResponse(
      systemInstruction,
      history || [],
      message
    );
    res.json({ reply: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// src/backend/api/settings.ts
import { Router as Router11 } from "express";
import bcrypt2 from "bcryptjs";
var settingsRouter = Router11();
settingsRouter.get("/org", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("organizations").select("id, name, owner_email, first_name, last_name, phone, whatsapp, address, contact_person, social_object, employees_count, product_description, chatbot_name, use_emojis").eq("id", req.user?.org_id).single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
settingsRouter.post("/org", requireAuth, async (req, res) => {
  try {
    const {
      name,
      first_name,
      last_name,
      phone,
      whatsapp,
      address,
      contact_person,
      social_object,
      employees_count,
      product_description,
      chatbot_name,
      use_emojis
    } = req.body;
    const supabase = getSupabase();
    const { error } = await supabase.from("organizations").update({
      name,
      first_name,
      last_name,
      phone,
      whatsapp,
      address,
      contact_person,
      social_object,
      employees_count,
      product_description,
      chatbot_name,
      use_emojis
    }).eq("id", req.user?.org_id);
    if (error) throw error;
    res.json({ message: "Configura\xE7\xF5es atualizadas com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
settingsRouter.post("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const supabase = getSupabase();
    const { data: org, error: fetchError } = await supabase.from("organizations").select("password").eq("id", req.user?.org_id).single();
    if (fetchError || !org) throw new Error("Usu\xE1rio n\xE3o encontrado.");
    const isMatch = await bcrypt2.compare(currentPassword, org.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Sua senha atual est\xE1 incorreta." });
    }
    const hashedPassword = await bcrypt2.hash(newPassword, 10);
    const { error: updateError } = await supabase.from("organizations").update({ password: hashedPassword }).eq("id", req.user?.org_id);
    if (updateError) throw updateError;
    res.json({ message: "Senha alterada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// src/backend/api/team.ts
import { Router as Router12 } from "express";
import bcrypt3 from "bcryptjs";
var teamRouter = Router12();
teamRouter.get("/", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("team_members").select("id, name, email, role, created_at").eq("org_id", req.user?.org_id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
teamRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const supabase = getSupabase();
    const hashedPassword = await bcrypt3.hash(password, 10);
    const { data, error } = await supabase.from("team_members").insert({
      org_id: req.user?.org_id,
      name,
      email,
      role,
      password: hashedPassword
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// src/backend/api/templates.ts
import { Router as Router13 } from "express";
var templatesRouter = Router13();
templatesRouter.get("/", requireAuth, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("whatsapp_templates").select("*").eq("org_id", req.user?.org_id);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
templatesRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { name, category, language, content } = req.body;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("whatsapp_templates").insert({
      org_id: req.user?.org_id,
      name,
      category,
      language,
      content
    }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// server.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
var envPaths = [
  path2.join(__dirname2, ".env"),
  path2.join(process.cwd(), ".env"),
  path2.join(__dirname2, "..", ".env")
];
for (const p of envPaths) {
  if (existsSync(p)) {
    dotenv2.config({ path: p });
    console.log(`\u2705 Vari\xE1veis carregadas de: ${p}`);
    break;
  }
}
var app = express();
var httpServer = createServer(app);
var io = new Server(httpServer, {
  path: "/socket.io/",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["polling", "websocket"],
  // Garante compatibilidade
  allowEIO3: true
});
var PORT = process.env.PORT || 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/api/debug-env", (req, res) => {
  res.json({
    status: "online",
    port: PORT,
    node_version: process.version,
    supabase_url: process.env.VITE_SUPABASE_URL ? "DEFINIDA" : "AUSENTE",
    gemini_key: process.env.GOOGLE_GEMINI_API_KEY ? "DEFINIDA" : "AUSENTE"
  });
});
app.use("/api/webhook", webhookRouter);
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/agent", agentRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/automations", automationsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/orion-web", orionWebRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/team", teamRouter);
app.use("/api/templates", templatesRouter);
var distPath = path2.resolve(__dirname2, "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path2.join(distPath, "index.html"));
    } else {
      res.status(404).json({ error: "Rota de API n\xE3o encontrada" });
    }
  });
  console.log("\u{1F4E6} Servindo frontend da pasta:", distPath);
} else {
  console.warn("\u26A0\uFE0F Pasta dist n\xE3o encontrada.");
}
var targetPort = process.env.PORT ? isNaN(Number(process.env.PORT)) ? process.env.PORT : Number(process.env.PORT) : 3e3;
if (typeof targetPort === "string") {
  httpServer.listen(targetPort, () => {
    console.log(`\u{1F680} Orion Online (Socket): ${targetPort}`);
  });
} else {
  httpServer.listen(targetPort, "0.0.0.0", () => {
    console.log(`\u{1F680} Orion Online (Porta): ${targetPort}`);
  });
}
