import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { GeminiService } from '../services/gemini.service';

export const knowledgeRouter = Router();

// Processar documentos para RAG (Embeddings)
knowledgeRouter.post('/process', async (req, res) => {
    const { org_id, document_id, content } = req.body;
    if (!content) return res.status(400).json({ error: "Conteúdo vazio" });

    try {
        const supabase = getSupabase();

        // 1. Gerar Embedding usando o novo GeminiService
        const embedding = await GeminiService.generateEmbeddings(content);

        // 2. Salvar Chunk no banco de dados (tabela knowledge_chunks com pgvector)
        const { error } = await supabase.from('knowledge_chunks').insert({
            org_id,
            document_id: document_id || null,
            content,
            embedding
        });

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        console.error("[Knowledge API] Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Listar documentos
knowledgeRouter.get('/', async (req, res) => {
    const org_id = (req as any).user?.org_id;
    const supabase = getSupabase();
    const { data, error } = await supabase.from('knowledge_documents').select('*').eq('org_id', org_id);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});
