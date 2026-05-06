import { Router } from 'express';
import { getSupabase } from '../services/supabase.service.ts';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req, res) => {
    try {
        const supabase = getSupabase();
        
        // 1. Contar chats ativos hoje
        const { count: activeChats, error: chatError } = await supabase
            .from('chat_sessions')
            .select('*', { count: 'exact', head: true });

        // 2. Contar mensagens totais
        const { count: messagesToday, error: msgError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true });

        // 3. Contar automações
        const { count: automationsRunning, error: autoError } = await supabase
            .from('automations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        if (chatError || msgError || autoError) {
            console.error("[Dashboard] Erro ao buscar stats:", chatError || msgError || autoError);
        }

        res.json({
            activeChats: activeChats || 0,
            messagesToday: messagesToday || 0,
            automationsRunning: automationsRunning || 0
        });
    } catch (error) {
        console.error("[Dashboard] Falha critica:", error);
        res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
});
