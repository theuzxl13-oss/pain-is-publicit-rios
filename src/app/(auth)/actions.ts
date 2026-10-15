"use server";

import { redirect } from "next/navigation";
import type {
  ForgotPasswordInput,
  NewPasswordInput,
  SignInInput,
  SignUpInput,
} from "@/lib/validation/auth";
import * as auth from "@/server/services/auth-service";

export async function signInAction(input: SignInInput, next?: string) {
  const result = await auth.signIn(input, next);
  if (result.ok && result.data) redirect(result.data.redirectTo);
  return result;
}

export async function signUpAction(input: SignUpInput) {
  return auth.signUp(input);
}

export async function forgotPasswordAction(input: ForgotPasswordInput) {
  return auth.requestPasswordReset(input);
}

export async function resetPasswordAction(input: NewPasswordInput) {
  const result = await auth.setNewPassword(input);
  if (result.ok) redirect("/painel?senha=atualizada");
  return result;
}

export async function signOutAction() {
  await auth.signOut();
  redirect("/");
}
