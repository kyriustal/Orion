-- Adiciona colunas extras para perfil na tabela organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS social_object TEXT,
ADD COLUMN IF NOT EXISTS employees_count TEXT,
ADD COLUMN IF NOT EXISTS product_description TEXT,
ADD COLUMN IF NOT EXISTS chatbot_name TEXT;

-- Tabela de Membros da Equipe
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'agent', -- 'admin', 'agent', 'viewer'
    password TEXT NOT NULL, -- Senha com hash bcrypt
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Templates (HSM)
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    language TEXT DEFAULT 'pt_BR',
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
