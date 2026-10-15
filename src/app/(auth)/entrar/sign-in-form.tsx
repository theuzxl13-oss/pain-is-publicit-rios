"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { signInAction } from "../actions";

export function SignInForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const res = await signInAction(values, next);
      if (res && !res.ok) setError(res.error);
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert variant="destructive" title={error} />}
      <FormField id="email" label="E-mail" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </FormField>
      <FormField id="password" label="Senha" required error={errors.password?.message}>
        <PasswordInput autoComplete="current-password" {...form.register("password")} />
      </FormField>
      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-medium text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton pending={pending} pendingText="Entrando…" size="lg" className="w-full">
        Entrar
      </SubmitButton>
    </form>
  );
}
