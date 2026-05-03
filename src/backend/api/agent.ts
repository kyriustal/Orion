import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { AIOrchestratorService } from '../services/ai_orchestrator.service';
import { GeminiService } from '../services/gemini.service';
import { AutomationService } from '../services/automation.service';

export const agentRouter = Router();

agentRouter.post('/simulate', async (req, res) => {
    const { message, history } = req.body;
    const org_id = (req as any).user?.org_id;

    if (!org_id) return res.status(401).json({ error: "Nao autorizado" });

    try {
        const supabase = getSupabase();

        // 1. Busca Dados da Organizacao
        const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', org_id)
            .single();

        // 2. Tenta disparar Automação primeiro (Trigger Rápido)
        const triggeredAuto = await AutomationService.triggerAutomation(org_id, message);
        if (triggeredAuto) {
            const actionResult = await AutomationService.executeAction(triggeredAuto, { org_id });
            if (actionResult && actionResult.reply) {
                return res.json({ 
                    reply: actionResult.reply, 
                    automation_triggered: triggeredAuto.name 
                });
            }
        }

        // 3. Busca Conhecimento (RAG)
        let knowledge = "";
        try {
            const embedding = await GeminiService.generateEmbeddings(message);
            const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
                query_embedding: embedding,
                match_threshold: 0.3,
                match_count: 5,
                p_org_id: org_id
            });

            if (chunks && chunks.length > 0) {
                knowledge = chunks.map((c: any) => c.content).join("\n\n---\n\n");
            }
        } catch (ragError) {
            console.warn("RAG Fallback triggered:", ragError);
            knowledge = org?.product_description || "";
        }

        // 4. Instruções do Sistema (Persona)
        const botName = org?.chatbot_name || "Orion";
        const companyName = org?.name || "Nossa Empresa";
        
        const systemInstruction = `Voce e o assistente virtual ${botName} da empresa ${companyName}.
        
        CONTEXTO EMPRESARIAL:
        ${org?.product_description || "Atendimento profissional e eficiente."}
        
        CONHECIMENTO ADICIONAL:
        ${knowledge || "Sem documentos adicionais."}
        
        REGRAS:
        - Responda de forma curta e objetiva.
        - Se nao souber, diga que vai transferir para um humano.
        - Use emojis: ${org?.use_emojis ? "SIM" : "NAO"}.
        - Tom de voz: Profissional e Acolhedor.`;

        // 5. Gerar Resposta IA
        const response = await AIOrchestratorService.generateChatResponse(
            systemInstruction,
            history || [],
            message
        );

        res.json({ reply: response.text });
    } catch (error: any) {
        console.error("[Agent API] Erro critico:", error);
        res.status(500).json({ error: "Erro interno no servidor de IA." });
    }
});
