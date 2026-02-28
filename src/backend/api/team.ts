import { Router } from "express";
import bcrypt from "bcryptjs";
import { getSupabase } from "../services/supabase.service";
import { requireAuth } from "../middleware/auth.middleware";

export const teamRouter = Router();

// List Team Members
teamRouter.get("/", requireAuth, async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("team_members")
            .select("id, name, email, role, created_at")
            .eq("org_id", req.user?.org_id);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Add Team Member
teamRouter.post("/", requireAuth, async (req, res) => {
    try {
        const { name, email, role, password } = req.body;
        const supabase = getSupabase();

        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error } = await supabase
            .from("team_members")
            .insert({
                org_id: req.user?.org_id,
                name,
                email,
                role,
                password: hashedPassword
            })
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
