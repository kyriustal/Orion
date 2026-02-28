import { Router } from "express";
import { getSupabase } from "../services/supabase.service";
import { requireAuth } from "../middleware/auth.middleware";

export const settingsRouter = Router();

// Get Org Settings
settingsRouter.get("/org", requireAuth, async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("organizations")
            .select("id, name, use_emojis")
            .eq("id", req.user?.org_id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Update Org Settings
settingsRouter.post("/org", requireAuth, async (req, res) => {
    try {
        const { use_emojis } = req.body;
        const supabase = getSupabase();

        const { error } = await supabase
            .from("organizations")
            .update({ use_emojis })
            .eq("id", req.user?.org_id);

        if (error) throw error;
        res.json({ message: "Configurações atualizadas com sucesso!" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
