import { Router } from 'express';

export const chatsRouter = Router();

// GET /api/chats - Listar conversas ativas (Caixa de Entrada)
chatsRouter.get('/', async (req, res) => {
  const orgId = req.user?.org_id;
  
  // TODO: Buscar da tabela chat_sessions
  res.json([
    { id: 'session-1', user_phone: '5511999999999', last_interaction: new Date().toISOString(), is_human_overflow: true, unread: 2 },
    { id: 'session-2', user_phone: '5511888888888', last_interaction: new Date(Date.now() - 3600000).toISOString(), is_human_overflow: false, unread: 0 }
  ]);
});

// GET /api/chats/:sessionId/messages - Obter histórico de uma conversa
chatsRouter.get('/:sessionId/messages', async (req, res) => {
  const { sessionId } = req.params;
  
  // TODO: Buscar da tabela messages
  res.json([
    { id: 'msg-1', role: 'user', content: 'Gostaria de falar com um humano', created_at: new Date(Date.now() - 60000).toISOString() },
    { id: 'msg-2', role: 'model', content: 'Um atendente humano assumirá a conversa em breve.', created_at: new Date(Date.now() - 58000).toISOString() }
  ]);
});

// POST /api/chats/:sessionId/takeover - Assumir atendimento (Pausa a IA)
chatsRouter.post('/:sessionId/takeover', async (req, res) => {
  const { sessionId } = req.params;
  // TODO: Update chat_sessions set is_human_overflow = true
  res.json({ message: 'Atendimento humano iniciado. IA pausada para este chat.' });
});

// POST /api/chats/:sessionId/resolve - Resolver atendimento (Reativa a IA)
chatsRouter.post('/:sessionId/resolve', async (req, res) => {
  const { sessionId } = req.params;
  // TODO: Update chat_sessions set is_human_overflow = false
  res.json({ message: 'Atendimento resolvido. IA reativada para este chat.' });
});

// POST /api/chats/:sessionId/send - Enviar mensagem manual pelo painel
chatsRouter.post('/:sessionId/send', async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  // TODO: Disparar via WhatsAppService e salvar na tabela messages com role 'agent'
  res.json({ message: 'Mensagem enviada com sucesso.' });
});
