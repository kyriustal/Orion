import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL?.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!url || !key) {
      console.error('CRITICAL: Supabase environment variables (URL or KEY) are missing!');
      console.warn('Backend will use MOCK data. Login will FAIL.');
      // ... (mock implementation remains same) ...
      return {
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'SUPABASE_KEYS_MISSING' } }), order: () => ({ limit: () => ({ data: [] }) }) }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'mock' } }) }), then: (cb: any) => cb({ data: null }) }),
          update: () => ({ eq: () => ({ then: (cb: any) => cb({ data: null }) }) })
        })
      } as any;
    }

    // Basic check for service_role
    if (key.includes('anon')) {
      console.error('WARNING: You seem to be using an ANON key instead of SERVICE_ROLE key!');
    }

    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

export class SupabaseService {
  static async getWhatsAppConfig(phoneNumberId: string) {
    const { data, error } = await getSupabase()
      .from('whatsapp_configs')
      .select('*, organizations(subscription_plans(ai_model))')
      .eq('phone_number_id', phoneNumberId)
      .single();

    if (error && error.code !== 'PGRST116') console.error('Error fetching config:', error);
    return data;
  }

  static async getOrCreateSession(orgId: string, userPhone: string) {
    let { data: session } = await getSupabase()
      .from('chat_sessions')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_phone', userPhone)
      .single();

    if (!session) {
      const { data: newSession } = await getSupabase()
        .from('chat_sessions')
        .insert([{ org_id: orgId, user_phone: userPhone }])
        .select()
        .single();
      session = newSession;
    } else {
      // Atualiza last_interaction
      await getSupabase()
        .from('chat_sessions')
        .update({ last_interaction: new Date().toISOString() })
        .eq('id', session.id);
    }
    return session;
  }

  static async setHumanOverflow(sessionId: string, value: boolean) {
    await getSupabase().from('chat_sessions').update({ is_human_overflow: value }).eq('id', sessionId);
  }

  static async setOptOut(sessionId: string, value: boolean) {
    await getSupabase().from('chat_sessions').update({ opt_out: value }).eq('id', sessionId);
  }

  static async saveMessage(sessionId: string, role: 'user' | 'model', content: string) {
    await getSupabase().from('messages').insert([{ session_id: sessionId, role, content }]);
  }

  static async getChatHistory(sessionId: string, limit: number = 10) {
    const { data } = await getSupabase()
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).reverse(); // Retorna em ordem cronológica para o Gemini
  }
}
