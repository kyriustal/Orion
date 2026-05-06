import { Router } from 'express';
import { getSupabase } from '../services/supabase.service.ts';
import { AIOrchestratorService } from '../services/ai_orchestrator.service.ts';

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
    res.status(500).json({ error: 'Falha ao buscar histórico' });
  }
});

// POST /api/chats/:sessionId/send - Enviar mensagem e obter resposta da IA
chatsRouter.post('/:sessionId/send', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  const org_id = (req as any).user?.org_id || '00000000-0000-0000-0000-000000000000';

  try {
    const supabase = getSupabase();

    // 1. Salvar Mensagem do Usuário (Agente/Admin) no banco
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message
    });

    // 2. Buscar contexto para a IA
    const { data: org } = await supabase.from('organizations').select('*').eq('id', org_id).single();
    
    const systemInstruction = `Você é o assistente da ${org?.name || 'Orion'}. 
    Responda ao usuário no chat do dashboard. 
    Contexto: ${org?.product_description || ''}`;

    // 3. Gerar Resposta da IA
    const aiResponse = await AIOrchestratorService.generateChatResponse(systemInstruction, [], message);

    // 4. Salvar Resposta da IA no banco
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'model',
      content: aiResponse.text
    });

    // 5. Atualizar última interação na sessão
    await supabase.from('chat_sessions').update({ 
      last_interaction: new Date().toISOString() 
    }).eq('id', sessionId);

    res.json({ reply: aiResponse.text });
  } catch (error) {
    console.error("[Chat Send] Erro:", error);
    res.status(500).json({ error: 'Falha ao enviar mensagem ou processar IA' });
  }
});
