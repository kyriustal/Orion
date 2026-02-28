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

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }
      console.error('Supabase Login Error:', error);
      return res.status(500).json({
        error: 'Erro de conexão com o banco de dados.',
        details: error.message,
        code: error.code
      });
    }

    if (!org) {
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
        plan_status: 'trial',
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        whatsapp: whatsapp,
        address: address,
        contact_person: contact,
        social_object: socialObject,
        employees_count: employees,
        product_description: product,
        chatbot_name: chatbotName
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
  const { data: user, error } = await getSupabase()
    .from('organizations')
    .select('first_name, last_name, owner_email, name, phone, whatsapp, address, social_object, employees_count, product_description, chatbot_name')
    .eq('id', req.user?.id)
    .single();

  if (error) {
    console.error('Supabase /me Error:', error);
    return res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
  }

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  res.json({
    user: {
      ...req.user,
      name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.name,
      email: user.owner_email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      whatsapp: user.whatsapp,
      address: user.address,
      social_object: user.social_object,
      employees_count: user.employees_count,
      product_description: user.product_description,
      chatbot_name: user.chatbot_name,
    }
  });
});
