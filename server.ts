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

// Carregar .env de múltiplos caminhos possíveis (Hostinger)
const possibleEnvPaths = [
  path.resolve(__dirname, '.env'),
  path.resolve(process.cwd(), '.env'),
  path.join(__dirname, '..', '.env')
];

let envFound = false;
for (const p of possibleEnvPaths) {
  if (existsSync(p)) {
    dotenv.config({ path: p });
    console.log('✅ Arquivo .env carregado de:', p);
    envFound = true;
    break;
  }
}

if (!envFound) {
  console.warn('⚠️ Nenhum arquivo .env encontrado. Usando variáveis de ambiente do sistema.');
  dotenv.config();
}

// Importações das APIs
import webhookRouter from "./src/backend/api/webhook.ts";
import { authRouter } from "./src/backend/api/auth.ts";
import { dashboardRouter } from "./src/backend/api/dashboard.ts";
import { whatsappRouter } from "./src/backend/api/whatsapp.ts";
import { agentRouter } from "./src/backend/api/agent.ts";
import { chatsRouter } from "./src/backend/api/chats.ts";
import { automationsRouter } from "./src/backend/api/automations.ts";
import { subscriptionsRouter } from "./src/backend/api/subscriptions.ts";
import { knowledgeRouter } from "./src/backend/api/knowledge.ts";
import { orionWebRouter } from "./src/backend/api/orion-web.ts";
import { settingsRouter } from "./src/backend/api/settings.ts";
import { teamRouter } from "./src/backend/api/team.ts";
import { templatesRouter } from "./src/backend/api/templates.ts";

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
// Conforme solicitado: listen(Number(process.env.PORT) || 3000, '0.0.0.0')
const targetPort = process.env.PORT ? (isNaN(Number(process.env.PORT)) ? process.env.PORT : Number(process.env.PORT)) : 3000;

if (typeof targetPort === 'string') {
    // Se for um socket (Hostinger/Passenger)
    httpServer.listen(targetPort, () => {
        console.log(`🚀 Orion Online (Socket): ${targetPort}`);
    });
} else {
    // Se for uma porta (Local ou Hostinger Port)
    httpServer.listen(targetPort, '0.0.0.0', () => {
        console.log(`🚀 Orion Online (Porta): ${targetPort}`);
    });
}
