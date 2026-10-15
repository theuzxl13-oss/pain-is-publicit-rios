import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

/**
 * Confirmação de e-mail e links de recuperação de senha.
 * Configure os templates de e-mail do Supabase para apontar para
 * {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<tipo>&next=<caminho>
 * (fluxo PKCE com "code" também é aceito).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const defaultNext = type === "recovery" ? "/redefinir-senha" : "/painel";
  const next = safeRedirectPath(searchParams.get("next"), defaultNext);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/entrar?erro=configuracao", origin));
  }

  const supabase = await createSupabaseServerClient();

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target =
        type === "signup" || type === "email"
          ? `${next}${next.includes("?") ? "&" : "?"}email=confirmado`
          : next;
      return NextResponse.redirect(new URL(target, origin));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(new URL("/entrar?erro=link_invalido", origin));
}
