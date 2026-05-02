import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { AIOrchestratorService } from '../services/ai_orchestrator.service';
import { GeminiService } from '../services/gemini.service';
import { AutomationService } from '../services/automation.service';

export const agentRouter = Router();

agentRouter.post('/simulate', async (req, res) => {
    const { message, history } = req.body;
    const org_id = (req as any).user?.org_id;

    try {
        const supabase = getSupabase();

        // 0. Busca Dados da Organização para Contexto
        const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', org_id)
            .single();

        // 0.1 Tenta disparar Automação primeiro
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

        // 1. Busca RAG (Vetorial) Real
        let knowledge = "";
        try {
            const embedding = await GeminiService.generateEmbeddings(message);
            const { data: chunks, error: rpcError } = await supabase.rpc('match_knowledge_chunks', {
                query_embedding: embedding,
                match_threshold: 0.3, // Reduzido para ser mais permissivo
                match_count: 5,
                p_org_id: org_id
            });

            if (rpcError) throw rpcError;

            if (chunks && chunks.length > 0) {
                knowledge = chunks.map((c: any) => c.content).join("\n\n---\n\n");
                console.log(`[Simulation RAG] Encontrados ${chunks.length} chunks.`);
            }
        } catch (ragError) {
            console.error("RAG Error in Simulation:", ragError);
            // Fallback para descrição do produto se RAG falhar
            knowledge = org?.product_description || "";
        }

        // 2. Definir Persona e Contexto
        const botName = org?.chatbot_name || "Orion";
        const companyName = org?.name || "nossa empresa";
        const dateStr = new Date().toLocaleDateString('pt-BR');

        const systemInstruction = `Você é o assistente virtual de IA chamado ${botName}, trabalhando para ${companyName}.
        Hoje é dia ${dateStr}.
        
        CONTEXTO DA EMPRESA:
        ${org?.product_description || "Uma empresa profissional focada em excelência."}
        
        BASE DE CONHECIMENTO ESPECÍFICA (RAG):
        ${knowledge || "Não há documentos adicionais. Use o contexto da empresa acima."}
        
        REGRAS DE OURO:
        - Responda SEMPRE em Português de Portugal ou Brasil conforme o cliente.
        - Se não souber a resposta na base de conhecimento, peça para o cliente aguardar um atendente humano de forma gentil.
        - Use emojis se configurado (Configuração: ${org?.use_emojis ? 'ATIVADO' : 'DESATIVADO'}).
        - Mantenha um tom profissional mas acolhedor.
        - NUNCA invente preços ou políticas que não estejam no texto acima.
        - Use formatação Markdown (negrito, listas) para facilitar a leitura.`;

        // 3. Gerar Resposta via Orquestrador
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
