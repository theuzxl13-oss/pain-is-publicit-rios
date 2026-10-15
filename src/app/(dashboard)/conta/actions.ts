"use server";

import type { NewPasswordInput } from "@/lib/validation/auth";
import type { CompanyInput, ProfileInput } from "@/lib/validation/profile";
import * as account from "@/server/services/account-service";
import { changePassword } from "@/server/services/auth-service";
import type { SelfServiceRole } from "@/server/domain/roles";

export async function updateProfileAction(input: ProfileInput) {
  return account.updateProfile(input);
}

export async function updateCompanyAction(input: CompanyInput) {
  return account.updateCompany(input);
}

export async function enableRoleAction(role: SelfServiceRole) {
  return account.enableRole(role);
}

export async function changePasswordAction(currentPassword: string, input: NewPasswordInput) {
  if (
    typeof currentPassword !== "string" ||
    currentPassword.length === 0 ||
    currentPassword.length > 72
  ) {
    return {
      ok: false as const,
      error: "Informe a senha atual.",
      fieldErrors: { currentPassword: "Informe a senha atual." },
    };
  }
  return changePassword(currentPassword, input);
}

export async function dataRequestAction(input: account.DataRequestInput) {
  return account.createDataSubjectRequest(input);
}
