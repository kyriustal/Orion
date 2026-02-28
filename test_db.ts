import { getSupabase } from "./src/backend/services/supabase.service.js"; // note: may need to use tsx instead of node
import dotenv from "dotenv";
dotenv.config();

async function testConnection() {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('organizations').select('*').limit(1);

    if (error) {
        if (error.code === '42P01') {
            console.log("NOT_RUN: As tabelas não existem ainda.");
        } else {
            console.error("ERROR:", error);
        }
    } else {
        console.log("SUCCESS: Banco de dados conectado e tabelas criadas!");
    }
}

testConnection();
