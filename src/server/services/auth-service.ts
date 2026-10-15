import "server-only";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";
import {
  forgotPasswordSchema,
  newPasswordSchema,
  signInSchema,
  signUpSchema,
  type ForgotPasswordInput,
  type NewPasswordInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";
import { zodFieldErrors } from "@/lib/validation/errors";
import { authErrorMessage } from "@/server/auth/errors";
import { defaultDashboardPath, isAppRole } from "@/server/domain/roles";
import { clientIp, rateLimit } from "@/server/security/rate-limit";
import type { ActionResult } from "@/types/actions";

const NOT_CONFIGURED: ActionResult<never> = {
  ok: false,
  error: "Autenticação indisponível: o Supabase ainda não foi configurado neste ambiente.",
};
const RATE_LIMITED: ActionResult<never> = {
  ok: false,
  error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
};

export async function signIn(
  input: SignInInput,
  next?: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Revise os campos.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const ip = await clientIp();
  if (!(await rateLimit(`signin:ip:${ip}`, 20, 600))) return RATE_LIMITED;
  if (!(await rateLimit(`signin:email:${parsed.data.email}`, 8, 600))) return RATE_LIMITED;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { ok: false, error: authErrorMessage(error) };

  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", data.user.id),
    supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle(),
  ]);

  if (profile?.status === "suspended") {
    await supabase.auth.signOut();
    return { ok: false, error: "Esta conta está suspensa. Entre em contato com o suporte." };
  }

  const fallback = defaultDashboardPath((roles ?? []).map((r) => r.role).filter(isAppRole));
  return { ok: true, data: { redirectTo: safeRedirectPath(next, fallback) } };
}

export async function signUp(input: SignUpInput): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const ip = await clientIp();
  if (!(await rateLimit(`signup:ip:${ip}`, 5, 3600))) return RATE_LIMITED;

  const d = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: d.email,
    password: d.password,
    options: {
      emailRedirectTo: siteUrl("/auth/confirm?next=/painel"),
      // Metadados são saneados pelo gatilho private.handle_new_user no banco.
      data: {
        full_name: d.fullName,
        phone: d.phone,
        document_number: d.document,
        company_name: d.companyName,
        account_type: d.accountType,
        accepted_terms: true,
      },
    },
  });

  if (error && error.code !== "user_already_exists") {
    return { ok: false, error: authErrorMessage(error) };
  }

  // Mesma resposta para e-mail novo ou existente (evita enumeração de contas).
  return {
    ok: true,
    message:
      "Enviamos um link de confirmação para o seu e-mail. Confirme para acessar a plataforma.",
  };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Revise os campos.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const ip = await clientIp();
  if (!(await rateLimit(`reset:ip:${ip}`, 5, 3600))) return RATE_LIMITED;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: siteUrl("/auth/confirm?next=/redefinir-senha"),
  });

  return {
    ok: true,
    message: "Se houver uma conta com este e-mail, você receberá um link para redefinir a senha.",
  };
}

export async function setNewPassword(input: NewPasswordInput): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Revise os campos.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user)
    return { ok: false, error: "Link expirado. Solicite uma nova redefinição de senha." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: authErrorMessage(error) };
  return { ok: true, message: "Senha atualizada com sucesso." };
}

/** Troca de senha a partir da área logada: exige a senha atual (reautenticação). */
export async function changePassword(
  currentPassword: string,
  input: NewPasswordInput,
): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Revise os campos.", fieldErrors: zodFieldErrors(parsed.error) };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email) return { ok: false, error: "Sessão expirada. Entre novamente." };

  if (!(await rateLimit(`chpwd:user:${auth.user.id}`, 5, 900))) return RATE_LIMITED;

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: currentPassword,
  });
  if (reauthError) {
    return {
      ok: false,
      error: "Senha atual incorreta.",
      fieldErrors: { currentPassword: "Senha atual incorreta." },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: authErrorMessage(error) };
  return { ok: true, message: "Senha alterada com sucesso." };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
