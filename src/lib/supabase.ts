import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;

export function getClientSupabase(): SupabaseClient | null {
  const metaEnv = (import.meta as any).env || {};
  const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('[Supabase Client] Failed to initialize:', err);
      return null;
    }
  }

  return clientInstance;
}

export const isClientSupabaseReady = (): boolean => {
  const metaEnv = (import.meta as any).env || {};
  return Boolean(metaEnv.VITE_SUPABASE_URL && metaEnv.VITE_SUPABASE_ANON_KEY);
};
