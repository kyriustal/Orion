import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Procura o .env na raiz do projeto de forma robusta
const envPath = existsSync(path.join(process.cwd(), '.env')) 
    ? path.join(process.cwd(), '.env')
    : path.resolve(__dirname, '../../../.env');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const getSupabase = () => {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error("[Supabase] ERRO: Chaves de configuracao ausentes!");
        throw new Error("Configuracao do Supabase incompleta no servidor.");
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
