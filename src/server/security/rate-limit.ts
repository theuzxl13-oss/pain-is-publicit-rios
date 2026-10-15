import "server-only";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const memory = new Map<string, { count: number; resetAt: number }>();

/**
 * Rate limit por chave. Usa o banco (compartilhado entre instâncias) quando
 * a service role está configurada; caso contrário, memória local da instância
 * (proteção parcial — ver docs/PLANO.md).
 */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { data, error } = await admin.rpc("rate_limit_hit", {
      _key: key,
      _max: max,
      _window_seconds: windowSeconds,
    });
    if (!error) return data === true;
    console.error(
      JSON.stringify({ level: "error", msg: "rate_limit_rpc_failed", error: error.message }),
    );
  }

  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}
