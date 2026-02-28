import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getSupabase } from '../services/supabase.service';
import { requireAuth } from '../middleware/auth.middleware';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orion_fallback_secret_321';

// POST /api/auth/login - Autenticação do usuário
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const supabase = getSupabase();
    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_email', email)
      .single();

    if (error || !org) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const isMatch = await bcrypt.compare(password, org.password || '');
    if (!isMatch) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: org.id, org_id: org.id, email: org.owner_email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: org.id,
        name: org.name,
        email: org.owner_email,
        org_id: org.id
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/register - Registro de novo Tenant
authRouter.post('/register', async (req, res) => {
  const {
    firstName, lastName, email, phone, whatsapp, address, contact,
    companyName, socialObject, employees, product, chatbotName, password
  } = req.body;

  try {
    const supabase = getSupabase();

    // Check if user exists
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_email', email)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: org, error } = await supabase
      .from('organizations')
      .insert([{
        name: companyName,
        owner_email: email,
        password: hashedPassword,
        plan_status: 'trial'
      }])
      .select()
      .single();

    if (error) throw error;

    // Nota: Configuração do WhatsApp será feita no primeiro acesso à página WhatsApp

    res.status(201).json({
      message: 'Conta criada com sucesso. Bem-vindo à Orion!',
      user: { email, firstName, lastName }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Obter dados do usuário logado
authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: req.user
  });
});
