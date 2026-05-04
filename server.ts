import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// APIs do Sistema
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
import { orionWebRouter } from "./src/backend/api/orion-web";
import { requireAuth } from "./src/backend/middleware/auth.middleware";

// Serviços
import { AIOrchestratorService } from "./src/backend/services/ai_orchestrator.service";
import { getSupabase } from "./src/backend/services/supabase.service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregamento de Ambiente
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;
  const httpServer = createServer(app);

  // Socket.io (Live Chat)
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    socket.on("join_chat", (id) => socket.join(id));
    socket.on("send_message", async (data) => {
      io.to(data.chatId).emit("new_message", data);
      
      // Resposta Automática da IA no Live Chat
      if (data.message.sender === "user" && data.isAiActive) {
        try {
          const systemInstruction = `Voce e o Orion. Responda como o assistente oficial.`;
          const response = await AIOrchestratorService.generateChatResponse(systemInstruction, [], data.message.text);
          
          io.to(data.chatId).emit("new_message", {
            chatId: data.chatId,
            message: { id: Date.now(), sender: "bot", text: response.text, time: new Date().toLocaleTimeString() }
          });
        } catch (e) { console.error("Erro IA LiveChat:", e); }
      }
    });
  });

  app.use(express.json());

  // Diagnóstico
  app.get("/api/health", (req, res) => res.json({ status: "ok", version: "2.1.0", time: new Date() }));

  // Rotas Publicas
  app.use("/api/auth", authRouter);
  app.use("/api/webhook", webhookRouter);
  app.use("/api/orion-web", orionWebRouter);

  // Rotas Privadas (Dashboard)
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/whatsapp", requireAuth, whatsappRouter);
  app.use("/api/agent", requireAuth, agentRouter);
  app.use("/api/chats", requireAuth, chatsRouter);
  app.use("/api/automations", requireAuth, automationsRouter);
  app.use("/api/subscriptions", requireAuth, subscriptionsRouter);
  app.use("/api/knowledge", requireAuth, knowledgeRouter);
  app.use("/api/billing", requireAuth, billingRouter);
  app.use("/api/team", requireAuth, teamRouter);
  app.use("/api/templates", requireAuth, templatesRouter);
  app.use("/api/settings", requireAuth, settingsRouter);

  // Servir Frontend
  const distPath = path.resolve(__dirname, 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Orion 2] Servidor Online na porta ${PORT}`);
    // Cron Jobs
    import("./src/backend/services/cron.service").then(m => m.startDailyCronJobs()).catch(() => {});
  });
}

startServer();
