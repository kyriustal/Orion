import { Router } from 'express';
import { getSupabase } from '../services/supabase.service';
import { GeminiService } from '../services/gemini.service';
import { requireAuth } from '../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

export const knowledgeRouter = Router();

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Divide texto longo em chunks menores com sobreposição para melhor contexto no RAG
 */
function splitIntoChunks(text: string, chunkSize = 700, overlap = 100): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
        const chunk = words.slice(i, i + chunkSize).join(' ').trim();
        if (chunk.length > 20) chunks.push(chunk);
        i += chunkSize - overlap;
    }
    return chunks;
}

/**
 * Extrai texto de ficheiros de diferentes tipos
 */
async function extractText(buffer: Buffer, mimetype: string, filename: string): Promise<string> {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // PDF
    if (ext === 'pdf' || mimetype === 'application/pdf') {
        try {
            const pdfParse = (await import('pdf-parse')).default;
            const data = await pdfParse(buffer);
            return data.text || '';
        } catch (e) {
            console.error('[Knowledge] PDF parse error:', e);
            return '';
        }
    }

    // DOCX
    if (ext === 'docx' || mimetype.includes('wordprocessingml') || mimetype.includes('msword')) {
        try {
            const mammoth = await import('mammoth');
            const result = await mammoth.extractRawText({ buffer });
            return result.value || '';
        } catch (e) {
            console.error('[Knowledge] DOCX parse error:', e);
            return '';
        }
    }

    // TXT, CSV, JSON, Markdown, etc.
    return buffer.toString('utf-8');
}

/**
 * Garante que o bucket 'knowledge' existe no Supabase Storage
 */
async function ensureBucketExists(): Promise<void> {
    const supabase = getSupabase();
    const { data } = await supabase.storage.getBucket('knowledge');
    if (!data) {
        await supabase.storage.createBucket('knowledge', {
            public: false,
            fileSizeLimit: 10485760 // 10MB
        });
        console.log('[Knowledge] Bucket "knowledge" criado no Supabase Storage.');
    }
}

// ─── ROUTES ─────────────────────────────────────────────────────────────────

/**
 * POST /api/knowledge/upload
 * Recebe um ficheiro, faz upload para o Supabase Storage, extrai texto,
 * gera embeddings e guarda os chunks no banco de dados.
 */
knowledgeRouter.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
    const org_id = req.user?.org_id;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    if (!org_id) return res.status(401).json({ error: 'Não autorizado.' });

    try {
        const supabase = getSupabase();

        // 1. Garantir que o bucket existe
        await ensureBucketExists();

        // 2. Upload para Supabase Storage
        const storagePath = `${org_id}/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { error: storageError } = await supabase.storage
            .from('knowledge')
            .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: true });

        if (storageError) {
            console.warn('[Knowledge] Aviso de Storage:', storageError.message);
        }

        // 3. Extrair texto do conteúdo
        const content = await extractText(file.buffer, file.mimetype, file.originalname);

        if (!content || content.trim().length < 10) {
            return res.status(400).json({ error: 'Não foi possível extrair texto deste ficheiro. Verifique se o PDF não está protegido ou é uma imagem.' });
        }

        // 4. Guardar metadados do documento
        const { data: doc, error: docError } = await supabase
            .from('knowledge_documents')
            .insert({
                org_id,
                filename: storagePath,
                original_name: file.originalname,
                content: content.substring(0, 50000), // Guarda até 50k chars como preview
                size: file.size,
                status: 'processing'
            })
            .select()
            .single();

        if (docError) throw docError;

        // 5. Responde imediatamente para não bloquear o utilizador
        res.json({
            success: true,
            file: {
                id: doc.id,
                name: file.originalname,
                size: file.size,
                status: 'processing'
            }
        });

        // 6. Processa embeddings em background (não bloqueia a resposta)
        (async () => {
            try {
                const chunks = splitIntoChunks(content);
                console.log(`[Knowledge] A processar ${chunks.length} chunks para documento ${doc.id}...`);

                for (const chunk of chunks) {
                    const embedding = await GeminiService.generateEmbeddings(chunk);
                    await supabase.from('knowledge_chunks').insert({
                        org_id,
                        document_id: doc.id,
                        content: chunk,
                        embedding
                    });
                }

                await supabase.from('knowledge_documents')
                    .update({ status: 'ready' })
                    .eq('id', doc.id);

                console.log(`[Knowledge] ✅ Documento ${doc.id} indexado: ${chunks.length} chunks criados.`);
            } catch (e: any) {
                console.error('[Knowledge] Erro ao gerar embeddings:', e.message);
                await supabase.from('knowledge_documents')
                    .update({ status: 'error' })
                    .eq('id', doc.id);
            }
        })();

    } catch (error: any) {
        console.error('[Knowledge API] Erro no upload:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/knowledge/files
 * Lista todos os documentos da organização
 */
knowledgeRouter.get('/files', requireAuth, async (req, res) => {
    const org_id = req.user?.org_id;
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('knowledge_documents')
        .select('id, original_name, size, status, created_at')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

/**
 * GET /api/knowledge/
 * Alias de /files para compatibilidade
 */
knowledgeRouter.get('/', requireAuth, async (req, res) => {
    const org_id = req.user?.org_id;
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('knowledge_documents')
        .select('id, original_name, size, status, created_at')
        .eq('org_id', org_id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
});

/**
 * DELETE /api/knowledge/:id
 * Remove documento e todos os seus chunks (cascade via FK)
 */
knowledgeRouter.delete('/:id', requireAuth, async (req, res) => {
    const org_id = req.user?.org_id;
    const { id } = req.params;
    const supabase = getSupabase();

    try {
        // Buscar caminho do ficheiro no Storage
        const { data: doc } = await supabase
            .from('knowledge_documents')
            .select('filename')
            .eq('id', id)
            .eq('org_id', org_id)
            .single();

        // Remover do Supabase Storage (se existir)
        if (doc?.filename) {
            await supabase.storage.from('knowledge').remove([doc.filename]);
        }

        // Remover do banco (chunks são eliminados por CASCADE)
        const { error } = await supabase
            .from('knowledge_documents')
            .delete()
            .eq('id', id)
            .eq('org_id', org_id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        console.error('[Knowledge API] Erro ao eliminar:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/knowledge/process
 * Endpoint legado - mantido para compatibilidade
 */
knowledgeRouter.post('/process', async (req, res) => {
    const { org_id, document_id, content } = req.body;
    if (!content) return res.status(400).json({ error: 'Conteúdo vazio' });

    try {
        const supabase = getSupabase();
        const embedding = await GeminiService.generateEmbeddings(content);
        const { error } = await supabase.from('knowledge_chunks').insert({
            org_id, document_id: document_id || null, content, embedding
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
