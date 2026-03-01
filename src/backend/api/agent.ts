import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { AIOrchestratorService } from '../services/ai_orchestrator.service';

export const agentRouter = Router();

agentRouter.post('/simulate', async (req, res) => {
    const { message, history, config } = req.body;
    const org_id = (req as any).user?.org_id;

    try {
        const supabase = getSupabase();

        // 1. Buscar Contexto (RAG Simplificado para Simulação)
        let knowledge = "";
        const { data: docs } = await supabase.from('knowledge_documents').select('content').eq('org_id', org_id);
        if (docs) knowledge = docs.map(d => d.content).join("\n\n");

        // 2. Definir Persona
        const systemInstruction = `Você é o agente ${config?.name || "Orion"}.
        Descrição do Agente: ${config?.description || "Assistente Virtual"}.
        Use este conhecimento para responder:
        ${knowledge || "Sem documentos cadastrados."}`;

        // 3. Gerar Resposta via Orquestrador
        const response = await AIOrchestratorService.generateChatResponse(
            systemInstruction,
            history || [],
            message
        );

        res.json({ reply: response.text });
    } catch (error: any) {
        res.status(500).json({ error: "Erro na simulação: " + error.message });
    }
});
