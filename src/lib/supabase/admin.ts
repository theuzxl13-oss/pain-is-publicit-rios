import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicEnv } from "@/lib/env";

/**
 * Cliente com service role: IGNORA o RLS. Uso restrito a webhooks, rotinas
 * agendadas e operações internas já autorizadas no servidor.
 * Retorna null se a chave não estiver configurada.
 */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  const env = getPublicEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
