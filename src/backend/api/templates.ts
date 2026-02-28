import { Router } from "express";
import { getSupabase } from "../services/supabase.service";
import { requireAuth } from "../middleware/auth.middleware";

export const templatesRouter = Router();

// List Templates
templatesRouter.get("/", requireAuth, async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("whatsapp_templates")
            .select("*")
            .eq("org_id", req.user?.org_id);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Create Template
templatesRouter.post("/", requireAuth, async (req, res) => {
    try {
        const { name, category, language, content } = req.body;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from("whatsapp_templates")
            .insert({
                org_id: req.user?.org_id,
                name,
                category,
                language,
                content
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
