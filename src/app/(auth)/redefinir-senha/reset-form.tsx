"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/validation/auth";
import { resetPasswordAction } from "../actions";

export function ResetPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const res = await resetPasswordAction(values);
      if (res && !res.ok) setError(res.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert variant="destructive" title={error} />}
      <FormField
        id="password"
        label="Nova senha"
        required
        hint="Mín. 10 caracteres, letras e números"
        error={errors.password?.message}
      >
        <PasswordInput autoComplete="new-password" {...form.register("password")} />
      </FormField>
      <FormField
        id="confirmPassword"
        label="Confirmar nova senha"
        required
        error={errors.confirmPassword?.message}
      >
        <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
      </FormField>
      <SubmitButton pending={pending} size="lg" className="w-full">
        Salvar nova senha
      </SubmitButton>
    </form>
  );
}
