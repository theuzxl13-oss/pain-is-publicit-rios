"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Megaphone, Repeat } from "lucide-react";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { signUpSchema, type SignUpInput } from "@/lib/validation/auth";
import { signUpAction } from "../actions";

const ACCOUNT_TYPES = [
  { value: "advertiser", label: "Anunciante", text: "Quero contratar painéis", icon: Megaphone },
  { value: "owner", label: "Proprietário", text: "Quero anunciar meus painéis", icon: Building2 },
  { value: "both", label: "Ambos", text: "Contratar e anunciar", icon: Repeat },
] as const;

export function SignUpForm({ defaultType }: { defaultType: SignUpInput["accountType"] }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      document: "",
      companyName: "",
      accountType: defaultType,
      password: "",
      confirmPassword: "",
      acceptTerms: false as unknown as true,
    },
  });
  const { errors } = form.formState;
  const accountType = form.watch("accountType");

  const onSubmit = form.handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await signUpAction(values);
      if (res.ok) {
        setResult({ ok: true, message: res.message ?? "Verifique seu e-mail." });
        form.reset();
      } else {
        Object.entries(res.fieldErrors ?? {}).forEach(([field, message]) =>
          form.setError(field as keyof SignUpInput, { message }),
        );
        setResult({ ok: false, message: res.error });
      }
    });
  });

  if (result?.ok) {
    return (
      <Alert variant="success" title="Cadastro recebido!">
        {result.message}
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {result && !result.ok && <Alert variant="destructive" title={result.message} />}

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tipo de conta</legend>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <label
              key={t.value}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-lg border p-3 text-center transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                accountType === t.value ? "border-primary bg-primary/5" : "hover:bg-secondary",
              )}
            >
              <input
                type="radio"
                value={t.value}
                className="sr-only"
                {...form.register("accountType")}
              />
              <t.icon
                aria-hidden
                className={cn(
                  "h-5 w-5",
                  accountType === t.value ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span className="text-sm font-semibold">{t.label}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">{t.text}</span>
            </label>
          ))}
        </div>
        {errors.accountType && (
          <p className="mt-2 text-xs font-medium text-destructive">{errors.accountType.message}</p>
        )}
      </fieldset>

      <FormField id="fullName" label="Nome completo" required error={errors.fullName?.message}>
        <Input autoComplete="name" {...form.register("fullName")} />
      </FormField>
      <FormField id="email" label="E-mail" required error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" {...form.register("email")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="phone" label="Telefone" hint="Com DDD" error={errors.phone?.message}>
          <Input type="tel" autoComplete="tel" inputMode="tel" {...form.register("phone")} />
        </FormField>
        <FormField
          id="document"
          label="CPF ou CNPJ"
          hint="Obrigatório para contratar ou receber"
          error={errors.document?.message}
        >
          <Input inputMode="numeric" {...form.register("document")} />
        </FormField>
      </div>
      <FormField
        id="companyName"
        label="Nome da empresa"
        hint="Opcional"
        error={errors.companyName?.message}
      >
        <Input autoComplete="organization" {...form.register("companyName")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="password"
          label="Senha"
          required
          hint="Mín. 10 caracteres, letras e números"
          error={errors.password?.message}
        >
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </FormField>
        <FormField
          id="confirmPassword"
          label="Confirmar senha"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
      </div>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
            aria-invalid={errors.acceptTerms ? true : undefined}
            aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
            {...form.register("acceptTerms")}
          />
          <span className="text-muted-foreground">
            Li e aceito os{" "}
            <Link
              href="/termos"
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms && (
          <p id="acceptTerms-error" className="mt-2 text-xs font-medium text-destructive">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <SubmitButton pending={pending} pendingText="Criando conta…" size="lg" className="w-full">
        Criar conta
      </SubmitButton>
    </form>
  );
}
