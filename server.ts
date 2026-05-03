import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Importação dos serviços e rotas
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregamento robusto do .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001;
  const httpServer = createServer(app);

  // Configuração Socket.io para Live Chat
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    socket.on("join_chat", (id) => socket.join(id));
    socket.on("send_message", (data) => {
        io.to(data.chatId).emit("new_message", data);
    });
  });

  // Middlewares essenciais
  app.use(express.json());

  // Rota de Diagnóstico (Vital para Hostinger)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      env_supabase: !!process.env.SUPABASE_URL,
      node_version: process.version,
      uptime: process.uptime()
    });
  });

  // Rotas da API
  app.use("/api/webhook", webhookRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/orion-web", orionWebRouter);
  
  // Rotas Protegidas
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

  // Entrega do Frontend (Pasta dist)
  const distPath = path.resolve(__dirname, 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Se não for uma rota de API, entrega o index.html (Single Page App)
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  }

  // Inicialização do Servidor
  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Orion] Servidor iniciado na porta ${PORT}`);
    
    // Iniciar Cron Jobs (envios agendados, etc)
    import("./src/backend/services/cron.service")
      .then(m => m.startDailyCronJobs())
      .catch(err => console.error("Falha ao iniciar Cron:", err));
  });
}

startServer().catch(err => {
    console.error("ERRO FATAL NA INICIALIZACAO:", err);
    process.exit(1);
});
