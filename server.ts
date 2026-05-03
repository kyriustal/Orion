import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Importações das APIs
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

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3001; 
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.on("connection", (socket) => {
    socket.on("join_chat", (id) => socket.join(id));
  });

  app.use(express.json());

  // Rotas de API
  app.use("/api/webhook", webhookRouter);
  app.use("/api/auth", authRouter);
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
  app.use("/api/orion-web", orionWebRouter);

  // Rota de Diagnóstico
  app.get("/api/debug-env", (req, res) => {
    res.json({
      status: "online",
      env_ok: !!process.env.SUPABASE_URL,
      node_version: process.version
    });
  });

  // Frontend: Servir a pasta dist
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
    console.log(`Servidor Orion rodando na porta ${PORT}`);
    // Cron Jobs
    import("./src/backend/services/cron.service").then(m => m.startDailyCronJobs()).catch(() => {});
  });
}

startServer().catch(console.error);
