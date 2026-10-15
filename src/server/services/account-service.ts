import "server-only";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  companySchema,
  profileSchema,
  type CompanyInput,
  type ProfileInput,
} from "@/lib/validation/profile";
import { zodFieldErrors } from "@/lib/validation/errors";
import { detectDocument } from "@/lib/validation/document";
import { requireUser } from "@/server/auth/session";
import { SELF_SERVICE_ROLES, type SelfServiceRole } from "@/server/domain/roles";
import type { ActionResult } from "@/types/actions";

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const user = await requireUser("/conta");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };

  const doc = parsed.data.document ? detectDocument(parsed.data.document) : null;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      document_type: doc?.kind ?? null,
      document_number: doc?.digits ?? null,
      marketing_opt_in: parsed.data.marketingOptIn,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: "Não foi possível salvar. Tente novamente." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Dados atualizados." };
}

export async function updateCompany(input: CompanyInput): Promise<ActionResult> {
  await requireUser("/conta");
  const parsed = companySchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: "Revise os campos destacados.",
      fieldErrors: zodFieldErrors(parsed.error),
    };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_my_company", {
    _legal_name: parsed.data.legalName,
    _trade_name: parsed.data.tradeName || null,
  });
  if (error) return { ok: false, error: "Não foi possível salvar os dados da empresa." };
  revalidatePath("/conta");
  return { ok: true, message: "Empresa atualizada." };
}

export async function enableRole(role: SelfServiceRole): Promise<ActionResult> {
  await requireUser("/conta");
  if (!(SELF_SERVICE_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: "Perfil não permitido." };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("enable_role", { _role: role });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("account_inactive")
        ? "Sua conta está suspensa."
        : "Não foi possível habilitar o perfil.",
    };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Perfil habilitado." };
}

export const dataRequestSchema = z.object({
  type: z.enum(["access", "correction", "deletion", "portability", "revocation"]),
  details: z.string().trim().max(3000).optional().default(""),
});
export type DataRequestInput = z.input<typeof dataRequestSchema>;

export async function createDataSubjectRequest(input: DataRequestInput): Promise<ActionResult> {
  const user = await requireUser("/conta");
  const parsed = dataRequestSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Solicitação inválida.", fieldErrors: zodFieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("data_subject_requests").insert({
    user_id: user.id,
    email: user.email,
    type: parsed.data.type,
    details: parsed.data.details || null,
  });
  if (error) return { ok: false, error: "Não foi possível registrar a solicitação." };
  revalidatePath("/conta");
  return { ok: true, message: "Solicitação registrada. Responderemos em até 15 dias." };
}
