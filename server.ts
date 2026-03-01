import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { GoogleGenAI, Type } from "@google/genai";
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
import { AIOrchestratorService } from "./src/backend/services/ai_orchestrator.service";
import { getSupabase } from "./src/backend/services/supabase.service";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



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

      if (data.message.sender === "user" && data.isAiActive) {
        try {
          const orgId = data.orgId || "00000000-0000-0000-0000-000000000000";
          const supabase = getSupabase();

          let knowledge = "";
          const { data: docs } = await supabase.from('knowledge_documents').select('content').eq('org_id', orgId);
          if (docs) knowledge = docs.map((d: any) => d.content).join("\n\n");

          const systemInstruction = `Você é o Orion, assistente da plataforma. Use este conhecimento: ${knowledge}`;
          const response = await AIOrchestratorService.generateChatResponse(systemInstruction, [], data.message.text);

          io.to(data.chatId).emit("new_message", {
            chatId: data.chatId,
            message: { id: Date.now(), sender: "bot", text: response.text, time: new Date().toLocaleTimeString() }
          });
        } catch (error) {
          console.error("Erro Live Chat IA:", error);
        }
      }


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

    // Rota do WebChat da Assistente Orion (Público/Integrado)
    app.use("/api/orion-web", orionWebRouter);

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
