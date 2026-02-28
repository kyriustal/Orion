import { Router } from "express";
import bcrypt from "bcryptjs";
import { getSupabase } from "../services/supabase.service";
import { requireAuth } from "../middleware/auth.middleware";

export const settingsRouter = Router();

// Get Org Settings
settingsRouter.get("/org", requireAuth, async (req, res) => {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("organizations")
            .select("id, name, owner_email, first_name, last_name, phone, whatsapp, address, contact_person, social_object, employees_count, product_description, chatbot_name, use_emojis")
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
        const {
            name, first_name, last_name, phone, whatsapp, address,
            contact_person, social_object, employees_count,
            product_description, chatbot_name, use_emojis
        } = req.body;

        const supabase = getSupabase();

        const { error } = await supabase
            .from("organizations")
            .update({
                name, first_name, last_name, phone, whatsapp, address,
                contact_person, social_object, employees_count,
                product_description, chatbot_name, use_emojis
            })
            .eq("id", req.user?.org_id);

        if (error) throw error;
        res.json({ message: "Configurações atualizadas com sucesso!" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Change Password
settingsRouter.post("/password", requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const supabase = getSupabase();

        // 1. Get current hash
        const { data: org, error: fetchError } = await supabase
            .from("organizations")
            .select("password")
            .eq("id", req.user?.org_id)
            .single();

        if (fetchError || !org) throw new Error("Usuário não encontrado.");

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, org.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Sua senha atual está incorreta." });
        }

        // 3. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update
        const { error: updateError } = await supabase
            .from("organizations")
            .update({ password: hashedPassword })
            .eq("id", req.user?.org_id);

        if (updateError) throw updateError;

        res.json({ message: "Senha alterada com sucesso!" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
