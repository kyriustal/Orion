import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { AIOrchestratorService } from '../services/ai_orchestrator.service';

export const orionWebRouter = Router();

orionWebRouter.post('/chat', async (req, res) => {
    const { message, history } = req.body;

    try {
        const supabase = getSupabase();

        // 1. Conhecimento da PRÓPRIA Orion (Configurado com um org_id fixo de sistema se houver)
        // Por agora, usamos uma instrução de sistema robusta
        const systemInstruction = `Você é a Orion, a Inteligência Artificial oficial da plataforma Orion 2.
        Seu objetivo é ajudar usuários sobre a plataforma: WhatsApp IA, CRM, Dashboard e Automações.
        Seja elegante, concisa e extremamente prestativa.`;

        const response = await AIOrchestratorService.generateChatResponse(
            systemInstruction,
            history || [],
            message
        );

        res.json({ reply: response.text });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
