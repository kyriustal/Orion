import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { AIOrchestratorService } from '../services/ai_orchestrator.service';
import { GeminiService } from '../services/gemini.service';

export const agentRouter = Router();

agentRouter.post('/simulate', async (req, res) => {
    const { message, history, config } = req.body;
    const org_id = (req as any).user?.org_id;

    try {
        const supabase = getSupabase();

        // 1. Busca RAG (Vetorial) Real
        let knowledge = "";
        try {
            const embedding = await GeminiService.generateEmbeddings(message);
            const { data: chunks } = await supabase.rpc('match_knowledge_chunks', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 5,
                p_org_id: org_id
            });

            if (chunks && chunks.length > 0) {
                knowledge = chunks.map((c: any) => c.content).join("\n\n---\n\n");
                console.log(`[Simulation RAG] Encontrados ${chunks.length} chunks.`);
            }
        } catch (ragError) {
            console.error("RAG Error in Simulation:", ragError);
            // Fallback para busca textual simples se RPC falhar
            const { data: docs } = await supabase.from('knowledge_documents').select('content').eq('org_id', org_id);
            if (docs) knowledge = docs.map(d => d.content).join("\n\n");
        }

        // 2. Definir Persona
        const systemInstruction = `Você é o agente de inteligência artificial chamado ${config?.name || "Orion"}.
        Sua descrição/personalidade: ${config?.description || "Um assistente profissional e prestativo"}.
        
        BASE DE CONHECIMENTO:
        ${knowledge || "Não há documentos específicos para esta empresa ainda. Responda com base no seu conhecimento geral, mas de forma profissional."}
        
        REGRAS:
        - Seja conciso e direto.
        - Use formatação Markdown.
        - Responda sempre em Português.`;

        // 3. Gerar Resposta via Orquestrador (Gemini -> OpenAI Fallback)
        const response = await AIOrchestratorService.generateChatResponse(
            systemInstruction,
            history || [],
            message
        );

        res.json({ reply: response.text });
    } catch (error: any) {
        console.error("Erro na simulação:", error);
        res.status(500).json({ error: "Erro na simulação: " + error.message });
    }
});
