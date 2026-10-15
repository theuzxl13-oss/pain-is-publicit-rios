import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { canAccessArea, isAppRole, type AppRole, type Area } from "@/server/domain/roles";

export type SessionProfile = {
  fullName: string;
  email: string | null;
  phone: string | null;
  documentType: "cpf" | "cnpj" | null;
  documentNumber: string | null;
  companyId: string | null;
  status: "active" | "suspended";
  marketingOptIn: boolean;
};

export type SessionUser = {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
  profile: SessionProfile | null;
  roles: AppRole[];
  isActive: boolean;
};

/**
 * Usuário autenticado da requisição atual (memoizado por requisição).
 * Papéis vêm do banco (user_roles), nunca de metadados editáveis pelo usuário.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Sempre dinâmico: a resposta depende dos cookies da requisição.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;

  const [profileRes, rolesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, email, phone, document_type, document_number, company_id, status, marketing_opt_in",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const p = profileRes.data;
  const profile: SessionProfile | null = p
    ? {
        fullName: p.full_name,
        email: p.email,
        phone: p.phone,
        documentType: p.document_type,
        documentNumber: p.document_number,
        companyId: p.company_id,
        status: p.status,
        marketingOptIn: p.marketing_opt_in,
      }
    : null;

  const roles = (rolesRes.data ?? []).map((r) => r.role).filter(isAppRole);

  return {
    id: user.id,
    email: user.email ?? null,
    emailConfirmed: Boolean(user.email_confirmed_at),
    profile,
    roles,
    isActive: profile?.status === "active",
  };
});

export async function requireUser(nextPath = "/painel"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  return user;
}

/** Exige acesso à área; caso contrário redireciona (nunca confia só no menu). */
export async function requireArea(area: Area, nextPath: string): Promise<SessionUser> {
  const user = await requireUser(nextPath);
  if (!canAccessArea(user.roles, area, user.isActive)) {
    redirect(user.isActive ? "/painel?acesso=negado" : "/conta?conta=suspensa");
  }
  return user;
}
