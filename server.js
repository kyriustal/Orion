import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Importação das APIs (Vamos converter estas também)
import { webhookRouter } from "./src/backend/api/webhook.js";
import { authRouter } from "./src/backend/api/auth.js";
import { dashboardRouter } from "./src/backend/api/dashboard.js";
import { whatsappRouter } from "./src/backend/api/whatsapp.js";
import { agentRouter } from "./src/backend/api/agent.js";
import { chatsRouter } from "./src/backend/api/chats.js";
import { automationsRouter } from "./src/backend/api/automations.js";
import { subscriptionsRouter } from "./src/backend/api/subscriptions.js";
import { knowledgeRouter } from "./src/backend/api/knowledge.js";
import { billingRouter } from "./src/backend/api/billing.js";
import { settingsRouter } from "./src/backend/api/settings.js";
import { teamRouter } from "./src/backend/api/team.js";
import { templatesRouter } from "./src/backend/api/templates.js";
import { orionWebRouter } from "./src/backend/api/orion-web.js";
import { requireAuth } from "./src/backend/middleware/auth.middleware.js";

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

  app.use(express.json());

  // Rotas de API
  app.use("/api/auth", authRouter);
  app.use("/api/webhook", webhookRouter);
  app.use("/api/agent", requireAuth, agentRouter);
  app.use("/api/automations", requireAuth, automationsRouter);
  app.use("/api/settings", requireAuth, settingsRouter);
  app.use("/api/knowledge", requireAuth, knowledgeRouter);
  app.use("/api/whatsapp", requireAuth, whatsappRouter);
  app.use("/api/dashboard", requireAuth, dashboardRouter);
  app.use("/api/chats", requireAuth, chatsRouter);
  app.use("/api/team", requireAuth, teamRouter);
  app.use("/api/templates", requireAuth, templatesRouter);
  app.use("/api/billing", requireAuth, billingRouter);
  app.use("/api/subscriptions", requireAuth, subscriptionsRouter);
  app.use("/api/orion-web", orionWebRouter);

  // Health Check
  app.get("/api/health", (req, res) => res.json({ status: "ok", mode: "production" }));

  // Frontend
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
    console.log(`[ORION] Servidor JS Online na porta ${PORT}`);
  });
}

startServer();
