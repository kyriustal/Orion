import { Router } from 'express';
import { getSupabase } from '../services/supabase.service.ts';
import { AIOrchestratorService } from '../services/ai_orchestrator.service.ts';
import { GeminiService } from '../services/gemini.service.ts';
import { AutomationService } from '../services/automation.service.ts';

export const agentRouter = Router();

agentRouter.post('/simulate', async (req, res) => {
    const { message, history } = req.body;
    const org_id = (req as any).user?.org_id || '00000000-0000-0000-0000-000000000000'; // Fallback para Demo

    try {
        const supabase = getSupabase();

        // 1. Busca Dados da Organizacao
        const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', org_id)
            .single();

        // 2. Busca Conhecimento (RAG)
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
            knowledge = org?.product_description || "";
        }

        // 3. Instruções do Sistema
        const botName = org?.chatbot_name || "Orion";
        const companyName = org?.name || "Nossa Empresa";
        const systemInstruction = `Voce e o assistente virtual ${botName} da empresa ${companyName}.
        CONTEXTO: ${org?.product_description || "Atendimento profissional."}
        CONHECIMENTO: ${knowledge}`;

        // 4. Gerar Resposta IA
        const response = await AIOrchestratorService.generateChatResponse(
            systemInstruction,
            history || [],
            message
        );

        // 5. SALVAR NO BANCO DE DADOS (O que estava faltando!)
        const sessionId = `sim-${Date.now()}`;
        
        // Criar Sessão
        await supabase.from('chat_sessions').upsert({
            id: sessionId,
            org_id: org_id,
            user_phone: 'Simulação Web'
        });

        // Salvar Mensagem do Usuário
        await supabase.from('messages').insert({
            session_id: sessionId,
            role: 'user',
            content: message
        });

        // Salvar Mensagem da IA
        await supabase.from('messages').insert({
            session_id: sessionId,
            role: 'model',
            content: response.text
        });

        res.json({ reply: response.text });
    } catch (error: any) {
        console.error("[Agent API] Erro:", error);
        res.status(500).json({ error: "Erro interno." });
    }
});
