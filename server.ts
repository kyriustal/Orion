import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// APIs
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

// Garante que o .env seja lido independente de onde o processo comece
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

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

  // Rotas
  app.use("/api/auth", authRouter);
  app.use("/api/webhook", webhookRouter);
  app.use("/api/agent", requireAuth, agentRouter);
  app.use("/api/automations", requireAuth, automationsRouter);
  app.use("/api/orion-web", orionWebRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/whatsapp", requireAuth, whatsappRouter);
  app.use("/api/chats", requireAuth, chatsRouter);
  app.use("/api/knowledge", requireAuth, knowledgeRouter);
  app.use("/api/billing", requireAuth, billingRouter);
  app.use("/api/team", requireAuth, teamRouter);
  app.use("/api/templates", requireAuth, templatesRouter);
  app.use("/api/settings", requireAuth, settingsRouter);
  app.use("/api/subscriptions", requireAuth, subscriptionsRouter);

  // Servir Frontend (Prioridade Máxima)
  const distPath = path.resolve(__dirname, 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    console.warn("[AVISO] Pasta 'dist' nao encontrada. O Frontend nao sera servido!");
  }

  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[ORION] Servidor rodando na porta ${PORT}`);
    // Cron Jobs em background
    import("./src/backend/services/cron.service").then(m => m.startDailyCronJobs()).catch(() => {});
  });
}

startServer().catch(err => {
  console.error("ERRO AO INICIAR SERVIDOR:", err);
});
