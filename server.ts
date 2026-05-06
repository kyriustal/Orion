import path from "path";
import { fileURLToPath } from "url";
import { existsSync, readFileSync } from "fs";
import dotenv from 'dotenv';
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Determinar __dirname para ESM
// Compatibilidade CJS/ESM para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração de Ambiente com busca exaustiva
const envPaths = [
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env'),
    path.join(__dirname, '..', '.env')
];

for (const p of envPaths) {
    if (existsSync(p)) {
        dotenv.config({ path: p });
        console.log(`✅ Variáveis carregadas de: ${p}`);
        break;
    }
}

// Importações das APIs (Garantindo extensões .ts para o compilador)
import { webhookRouter } from "./src/backend/api/webhook.ts";
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

import { appendFileSync } from "fs";

// Função para logar erros críticos antes de qualquer coisa
const logFatalError = (err: any) => {
    const msg = `\n[${new Date().toISOString()}] ERRO FATAL NA INICIALIZAÇÃO:\n${err.stack || err}\n`;
    console.error(msg);
    try {
        appendFileSync(path.join(__dirname, "erro_fatal.log"), msg);
    } catch (e) {}
};

try {
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      path: '/socket.io/',
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true
    });

    const PORT = process.env.PORT || 3001;

    // Middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Rota de Diagnóstico
    app.get('/api/debug-env', (req, res) => {
      res.json({
        status: 'online',
        port: PORT,
        node_version: process.version,
        supabase_url: process.env.VITE_SUPABASE_URL ? 'DEFINIDA' : 'AUSENTE',
        gemini_key: process.env.GOOGLE_GEMINI_API_KEY ? 'DEFINIDA' : 'AUSENTE'
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
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(distPath, 'index.html'));
        } else {
          res.status(404).json({ error: 'Rota de API não encontrada' });
        }
      });
    }

    // Iniciar Servidor (Compatível com Passenger)
    httpServer.listen(PORT, () => {
        console.log(`🚀 Orion Online: ${PORT}`);
    });

    // Capturar erros não tratados
    process.on('uncaughtException', logFatalError);
    process.on('unhandledRejection', logFatalError);

} catch (error) {
    logFatalError(error);
    process.exit(1);
}
