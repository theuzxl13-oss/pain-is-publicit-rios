"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await forgotPasswordAction(values);
      setResult(
        res.ok ? { ok: true, message: res.message ?? "" } : { ok: false, message: res.error },
      );
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {result && <Alert variant={result.ok ? "success" : "destructive"} title={result.message} />}
      <FormField id="email" label="E-mail" required error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </FormField>
      <SubmitButton pending={pending} size="lg" className="w-full">
        Enviar link de redefinição
      </SubmitButton>
    </form>
  );
}
