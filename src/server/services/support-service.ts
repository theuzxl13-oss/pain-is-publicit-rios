import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { supportSchema, type SupportInput } from "@/lib/validation/support";
import { zodFieldErrors } from "@/lib/validation/errors";
import { clientIp, rateLimit } from "@/server/security/rate-limit";
import type { ActionResult } from "@/types/actions";

export async function createSupportTicket(
  input: SupportInput,
): Promise<ActionResult<{ code: string }>> {
  const parsed = supportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }
  // Honeypot preenchido: responde sucesso sem gravar (não sinaliza ao robô).
  if (parsed.data.website) return { ok: true, data: { code: "--------" } };

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "O suporte está temporariamente indisponível. Tente novamente mais tarde.",
    };
  }

  const ip = await clientIp();
  if (!(await rateLimit(`support:ip:${ip}`, 10, 3600))) {
    return { ok: false, error: "Muitas mensagens enviadas. Tente novamente mais tarde." };
  }

  const supabase = await createSupabaseServerClient();
  const d = parsed.data;
  const { data, error } = await supabase.rpc("create_support_ticket", {
    _name: d.name,
    _email: d.email,
    _phone: d.phone || null,
    _topic: d.topic,
    _subject: d.subject,
    _message: d.message,
  });

  if (error) {
    if (error.message.includes("rate_limited")) {
      return { ok: false, error: "Muitas mensagens enviadas. Tente novamente mais tarde." };
    }
    console.error(
      JSON.stringify({ level: "error", msg: "support_ticket_failed", code: error.code }),
    );
    return { ok: false, error: "Não foi possível enviar sua mensagem. Tente novamente." };
  }

  return { ok: true, data: { code: String(data) } };
}
