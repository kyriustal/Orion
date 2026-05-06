import { Router } from 'express';
import { getSupabase } from '../services/supabase.service.ts';

export const chatsRouter = Router();

// GET /api/chats - Listar conversas reais
chatsRouter.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('last_interaction', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("[Chats] Erro ao listar:", error);
    res.status(500).json({ error: 'Falha ao buscar conversas' });
  }
});

// GET /api/chats/:sessionId/messages - Histórico real
chatsRouter.get('/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error("[Messages] Erro ao buscar histórico:", error);
    res.status(500).json({ error: 'Falha ao buscar histórico' });
  }
});

// POST /api/chats/:sessionId/takeover - Assumir atendimento
chatsRouter.post('/:sessionId/takeover', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_human_overflow: true })
      .eq('id', sessionId);

    if (error) throw error;
    res.json({ message: 'Atendimento humano iniciado.' });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao assumir chat' });
  }
});

// POST /api/chats/:sessionId/resolve - Reativar IA
chatsRouter.post('/:sessionId/resolve', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_human_overflow: false })
      .eq('id', sessionId);

    if (error) throw error;
    res.json({ message: 'Atendimento resolvido. IA reativada.' });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao resolver chat' });
  }
});
