import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { webhookRouter } from "./src/backend/api/webhook";
import { authRouter } from "./src/backend/api/auth";
import { dashboardRouter } from "./src/backend/api/dashboard";
import { whatsappRouter } from "./src/backend/api/whatsapp";
import { agentRouter } from "./src/backend/api/agent";
import { chatsRouter } from "./src/backend/api/chats";
import { automationsRouter } from "./src/backend/api/automations";
import { subscriptionsRouter } from "./src/backend/api/subscriptions";
import { knowledgeRouter } from "./src/backend/api/knowledge";
import { billingRouter } from "./src/backend/api/billing";
import { settingsRouter } from "./src/backend/api/settings";
import { teamRouter } from "./src/backend/api/team";
import { templatesRouter } from "./src/backend/api/templates";
import { requireAuth } from "./src/backend/middleware/auth.middleware";
import { getSupabase } from "./src/backend/services/supabase.service";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({ apiKey: (process.env.GEMINI_API_KEY || "AIzaSyAqYQ_81xhjaCglebJeAuD4cEoWg8rtRqo").trim(), httpOptions: { apiVersion: 'v1' } });

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

async function startServer() {
  const app = express();
  // Port logic
  const PORT = process.env.PORT || 3001;
  const httpServer = createServer(app);

  // Setup Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected to Live Chat:", socket.id);

    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    socket.on("send_message", async (data) => {
      // Broadcast to everyone in the room (including sender for confirmation)
      io.to(data.chatId).emit("new_message", data);

      // If the message is from the user (customer) and AI is active, generate a response
      if (data.message.sender === "user" && data.isAiActive) {
        try {
          // Simulate typing delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          const rawHistory = data.history ? data.history.map((msg: any) => ({
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

          // Identify the organization (tenant) context for this chat
          // In a real app we would get the orgId from the connected chat session
          // For now we assume a default or pass it through the socket data
          const orgId = data.orgId || "00000000-0000-0000-0000-000000000000";

          // Busca os documentos e regras específicas DESSA empresa no banco de dados SUPABASE
          const supabase = getSupabase();
          let companyKnowledgeBaseText = "";

          const { data: docs, error } = await supabase
            .from('knowledge_documents')
            .select('content')
            .eq('org_id', orgId);

          if (!error && docs && docs.length > 0) {
            companyKnowledgeBaseText = docs.map((d: any) => d.content).join('\n\n');
          }

          const chat = ai.chats.create({
            model: "gemini-2.0-flash-exp",
            config: {
              systemInstruction: `Você é o Orion, um Agente de Inteligência Artificial de elite, extremamente inteligente, conciso e profissional.
DIRETRIZES FUNDAMENTAIS:
1. TEXTO LIMPO: Jamais use ruídos, símbolos repetitivos ou caracteres desnecessários. Suas respostas devem ser esteticamente organizadas.
2. ESTRUTURA: Use Markdowns. *Negrito* para pontos importantes e listas para organização.
3. ESTILO: Responda de forma direta e humana. Evite introduções longas.
4. CONTEXTO ANGOLA: Atuamos com foco no mercado de Angola. A moeda é Kwanza (Kz). 
   - REGRA DE FRETE: O Frete Grátis para fora de Luanda aplica-se automaticamente para compras acima de 30.000 Kz.
5. FERRAMENTA transferToHuman: Acione IMEDIATAMENTE se o cliente pedir falar com um humano acompanhado de um motivo válido.

BASE DE CONHECIMENTO (FONTE ÚNICA DE VERDADE):
--------------------------------------------------
${companyKnowledgeBaseText || "Nenhuma documentação específica cadastrada para esta empresa ainda."}
--------------------------------------------------`,
              temperature: 0.2,
              tools: [{ functionDeclarations: [transferToHumanDeclaration] }]
            },
            history: cleanHistory
          });

          const response = await chat.sendMessage({ message: data.message.text });

          let replyText = response.text;
          let isTransfer = false;

          if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            if (call.name === "transferToHuman") {
              const reason = call.args?.reason || "Solicitação do cliente para falar com humano";
              console.log(`[ALERTA SECRETARIA] Chat ${data.chatId} solicitou transferência. Motivo: ${reason}`);
              replyText = "Compreendo. Estou transferindo o seu atendimento para a nossa equipe humana especializada. Por favor, aguarde um momento na linha.";
              isTransfer = true;
            }
          }

          const botMessage = {
            id: Date.now(),
            sender: "bot",
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };

          io.to(data.chatId).emit("new_message", { chatId: data.chatId, message: botMessage, isTransfer });
        } catch (error: any) {
          console.error("[ORION BOT ERROR] Error generating AI response in Live Chat:", error?.message || error);
          io.to(data.chatId).emit("new_message", {
            chatId: data.chatId,
            message: { id: Date.now(), sender: "bot", text: "Desculpe, encontrei um erro temporário ao processar sua resposta. Tente novamente.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
            isTransfer: false
          });
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Middleware para parsear JSON (necessário para o webhook da Meta e APIs)
  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "SaaS AI Agent Backend is running" });
  });

  // Registrar o Webhook do WhatsApp (Público - Autenticado pela Meta)
  app.use("/api/webhook", webhookRouter);

  // Rotas de Autenticação (Públicas)
  app.use("/api/auth", authRouter);

  // Rotas da Área do Cliente (Protegidas por requireAuth)
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/whatsapp", requireAuth, whatsappRouter);
  app.use("/api/agent", requireAuth, agentRouter);
  app.use("/api/chats", requireAuth, chatsRouter);
  app.use("/api/automations", requireAuth, automationsRouter);
  app.use("/api/subscriptions", requireAuth, subscriptionsRouter);
  app.use("/api/knowledge", requireAuth, knowledgeRouter);
  app.use("/api/team", requireAuth, teamRouter);
  app.use("/api/templates", requireAuth, templatesRouter);
  app.use("/api/settings", requireAuth, settingsRouter);

  // Middleware de Log para ajudar no Debugging de produção
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Frontend Routing
  const distPath = path.resolve(__dirname, 'dist');
  // Se NODE_ENV estiver em prod OU se a pasta dist existir fisicamente
  const isProduction = process.env.NODE_ENV === "production" ||
    process.env.NODE_ENV === "prod" ||
    existsSync(distPath);

  if (!isProduction) {
    console.log("Starting in DEVELOPMENT mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log(`Starting in PRODUCTION mode. Serving from: ${distPath}`);
    if (!existsSync(path.join(distPath, 'index.html'))) {
      console.error(`ERROR: index.html NOT FOUND in ${distPath}`);
    }
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        const indexHtml = path.join(distPath, 'index.html');
        if (existsSync(indexHtml)) {
          res.sendFile(indexHtml);
        } else {
          res.status(404).send('Frontend build (index.html) missing in dist folder.');
        }
      }
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

    // Start the background jobs
    import("./src/backend/services/cron.service").then((cron) => {
      cron.startDailyCronJobs();
    }).catch(err => console.error("Failed to load Cron Service:", err));
  });
}

startServer();
