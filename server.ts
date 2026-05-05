import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Determinar __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env com caminho absoluto (Vital para Hostinger)
const envPath = path.resolve(__dirname, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Arquivo .env carregado de:', envPath);
} else {
  console.warn('⚠️ Arquivo .env não encontrado em:', envPath);
  dotenv.config(); // Fallback para o padrão
}

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
import { orionWebRouter } from "./src/backend/api/orion-web";
import { settingsRouter } from "./src/backend/api/settings";
import { teamRouter } from "./src/backend/api/team";
import { templatesRouter } from "./src/backend/api/templates";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Diagnóstico para Hostinger
app.get('/api/debug-env', (req, res) => {
  res.json({
    status: 'online',
    port: PORT,
    node_version: process.version,
    env_loaded: existsSync(envPath),
    supabase_url: process.env.SUPABASE_URL ? 'DEFINIDA' : 'AUSENTE',
    gemini_key: process.env.GEMINI_API_KEY ? 'DEFINIDA' : 'AUSENTE',
    openai_key: process.env.OPENAI_API_KEY ? 'DEFINIDA' : 'AUSENTE'
  });
});

// Registrar Rotas da API
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

// Servir Frontend (Pasta dist)
const distPath = path.resolve(__dirname, 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    // Evitar que rotas de API caiam no index.html
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
  console.log('📦 Servindo frontend da pasta:', distPath);
} else {
  console.warn('⚠️ Pasta dist não encontrada. Rodar build localmente.');
}

// Socket.io
io.on("connection", (socket) => {
  console.log("Novo cliente conectado:", socket.id);
  socket.on("disconnect", () => console.log("Cliente desconectado"));
});

// Iniciar Servidor
const isSocket = isNaN(Number(PORT));

if (isSocket) {
  // Se for um Socket Unix (comum na Hostinger/Passenger), não passamos o host "0.0.0.0"
  httpServer.listen(PORT, () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 ORION 2 - SISTEMA ONLINE`);
    console.log(`📍 Ambiente: Produção (Hostinger)`);
    console.log(`🔌 Socket: ${PORT}`);
    console.log(`--------------------------------------------------`);
  });
} else {
  // Se for um número de porta padrão
  httpServer.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`--------------------------------------------------`);
    console.log(`🚀 ORION 2 - SISTEMA ONLINE`);
    console.log(`📍 Ambiente: Produção (Local/Port)`);
    console.log(`🔌 Porta: ${PORT}`);
    console.log(`--------------------------------------------------`);
  });
}
