import { Router } from 'express';
import { AIOrchestratorService } from '../services/ai_orchestrator.service';
import { getSupabase } from '../services/supabase.service';

export const orionWebRouter = Router();

// Endpoint público/logado para chat flutuante da própria Orion SaaS
orionWebRouter.post('/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Mensagem é obrigatória" });
        }

        // Recuperar org_id da Orion (a própria Orion deve ter um contexto global)
        // Para simplificar, vou puxar um contexto estático inicial, mas o ideal seria ela ler da BD principal se necessário
        const orionKnowledge = `
        Você é a Orion Assistente Virtual, a Inteligência Artificial Oficial da plataforma Orion (kyriustal/Orion).
        Seu objetivo é ajudar os usuários a entenderem o sistema, criarem agentes de WhatsApp super inteligentes e conhecerem nossos planos.
        
        INFORMAÇÕES SOBRE A ORION:
        - A Orion é uma plataforma que permite criar e gerenciar Agentes de Inteligência Artificial para WhatsApp.
        - Faz integração rápida com a API Meta Cloud (WhatsApp Business).
        - Os usuários podem carregar PDFs e textos na Base de Conhecimento (RAG) para que o Agente responda dúvidas complexas de forma autônoma.
        - Os Agentes da Orion podem transferir a conversa para um atendente humano se o cliente pedir.
        - TEMOS 3 PLANOS PRINCIPAIS (Kwanza - Kz):
          1. Starter: Grátis (Trial de mensagens).
          2. Pro: 25.000 Kz/mês.
          3. Enterprise: Sob consulta empresarial.
        
        DIRETRIZES:
        - Seja calorosa, rápida e direta nas respostas.
        - Se o usuário perguntar como conectar o WhatsApp, diga: "Vá ao menu 'WhatsApp', clique em 'Adicionar Número' e insira as chaves App ID, Waba ID e Token da Meta Developers."
        - Use formatação Markdown.
        - Aja como funcionária da empresa Orion. Responda APENAS perguntas sobre a Orion e criação de IA/WhatsApp.
        `;

        // Format history
        const rawHistory = history ? history.map((msg: any) => ({
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

        if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
            cleanHistory.shift();
        }

        const response = await AIOrchestratorService.generateChatResponse(
            orionKnowledge,
            cleanHistory,
            message
        );

        res.json({ reply: response.text });

    } catch (error: any) {
        console.error("Erro no chat web da Orion:", error);
        res.status(500).json({ error: "Erro ao processar mensagem." });
    }
});
