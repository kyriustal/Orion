import { Router } from 'express';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', (req, res) => {
    res.json({
        activeChats: 0,
        messagesToday: 0,
        automationsRunning: 0
    });
});
