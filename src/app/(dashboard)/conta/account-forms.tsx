"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PasswordInput } from "@/components/auth/password-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { newPasswordSchema } from "@/lib/validation/auth";
import {
  companySchema,
  profileSchema,
  type CompanyInput,
  type ProfileInput,
} from "@/lib/validation/profile";
import { ROLE_LABELS, type SelfServiceRole } from "@/server/domain/roles";
import type { ActionResult } from "@/types/actions";
import {
  changePasswordAction,
  dataRequestAction,
  enableRoleAction,
  updateCompanyAction,
  updateProfileAction,
} from "./actions";

type Feedback = { ok: boolean; message: string } | null;

function useFeedback() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const apply = (
    res: ActionResult<unknown>,
    setError?: (field: string, message: string) => void,
  ) => {
    if (res.ok) setFeedback({ ok: true, message: res.message ?? "Salvo." });
    else {
      Object.entries(res.fieldErrors ?? {}).forEach(([f, m]) => m && setError?.(f, m));
      setFeedback({ ok: false, message: res.error });
    }
  };
  const node = feedback && (
    <Alert variant={feedback.ok ? "success" : "destructive"} title={feedback.message} />
  );
  return { apply, node, reset: () => setFeedback(null) };
}

export function ProfileForm({ defaults }: { defaults: ProfileInput }) {
  const [pending, start] = useTransition();
  const fb = useFeedback();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: defaults,
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => {
        fb.reset();
        start(async () =>
          fb.apply(await updateProfileAction(values), (f, m) =>
            form.setError(f as keyof ProfileInput, { message: m }),
          ),
        );
      })}
    >
      {fb.node}
      <FormField id="fullName" label="Nome completo" required error={errors.fullName?.message}>
        <Input autoComplete="name" {...form.register("fullName")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="phone" label="Telefone" error={errors.phone?.message}>
          <Input type="tel" inputMode="tel" autoComplete="tel" {...form.register("phone")} />
        </FormField>
        <FormField id="document" label="CPF ou CNPJ" error={errors.document?.message}>
          <Input inputMode="numeric" {...form.register("document")} />
        </FormField>
      </div>
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[hsl(var(--primary))]"
          {...form.register("marketingOptIn")}
        />
        Quero receber novidades e ofertas por e-mail (opcional, revogável a qualquer momento).
      </label>
      <SubmitButton pending={pending}>Salvar dados</SubmitButton>
    </form>
  );
}

export function CompanyForm({ defaults }: { defaults: CompanyInput }) {
  const [pending, start] = useTransition();
  const fb = useFeedback();
  const form = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    defaultValues: defaults,
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => {
        fb.reset();
        start(async () =>
          fb.apply(await updateCompanyAction(values), (f, m) =>
            form.setError(f as keyof CompanyInput, { message: m }),
          ),
        );
      })}
    >
      {fb.node}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="legalName"
          label="Razão social / nome da empresa"
          required
          error={errors.legalName?.message}
        >
          <Input autoComplete="organization" {...form.register("legalName")} />
        </FormField>
        <FormField id="tradeName" label="Nome fantasia" error={errors.tradeName?.message}>
          <Input {...form.register("tradeName")} />
        </FormField>
      </div>
      <SubmitButton pending={pending}>Salvar empresa</SubmitButton>
    </form>
  );
}

const passwordFormSchema = z
  .object({ currentPassword: z.string().min(1, "Informe a senha atual") })
  .and(newPasswordSchema);
type PasswordFormInput = z.infer<typeof passwordFormSchema>;

export function PasswordForm() {
  const [pending, start] = useTransition();
  const fb = useFeedback();
  const form = useForm<PasswordFormInput>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={form.handleSubmit(({ currentPassword, password, confirmPassword }) => {
        fb.reset();
        start(async () => {
          const res = await changePasswordAction(currentPassword, { password, confirmPassword });
          fb.apply(res, (f, m) => form.setError(f as keyof PasswordFormInput, { message: m }));
          if (res.ok) form.reset();
        });
      })}
    >
      {fb.node}
      <FormField
        id="currentPassword"
        label="Senha atual"
        required
        error={errors.currentPassword?.message}
      >
        <PasswordInput autoComplete="current-password" {...form.register("currentPassword")} />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="newPassword"
          label="Nova senha"
          required
          hint="Mín. 10 caracteres, letras e números"
          error={errors.password?.message}
        >
          <PasswordInput autoComplete="new-password" {...form.register("password")} />
        </FormField>
        <FormField
          id="confirmNewPassword"
          label="Confirmar nova senha"
          required
          error={errors.confirmPassword?.message}
        >
          <PasswordInput autoComplete="new-password" {...form.register("confirmPassword")} />
        </FormField>
      </div>
      <SubmitButton pending={pending}>Alterar senha</SubmitButton>
    </form>
  );
}

export function EnableRoleButton({ role }: { role: SelfServiceRole }) {
  const [pending, start] = useTransition();
  const fb = useFeedback();
  return (
    <div className="space-y-3">
      {fb.node}
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => start(async () => fb.apply(await enableRoleAction(role)))}
      >
        {pending ? "Habilitando…" : `Habilitar perfil de ${ROLE_LABELS[role].toLowerCase()}`}
      </Button>
    </div>
  );
}

const DSR_TYPES = {
  access: "Acesso / cópia dos meus dados",
  correction: "Correção de dados",
  portability: "Portabilidade",
  deletion: "Exclusão / anonimização da conta",
  revocation: "Revogação de consentimento",
} as const;

export function DataRequestForm() {
  const [pending, start] = useTransition();
  const fb = useFeedback();
  const [type, setType] = useState<keyof typeof DSR_TYPES>("access");
  const [details, setDetails] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        fb.reset();
        start(async () => {
          const res = await dataRequestAction({ type, details });
          fb.apply(res);
          if (res.ok) setDetails("");
        });
      }}
    >
      {fb.node}
      <FormField id="dsr-type" label="Tipo de solicitação" required>
        <NativeSelect
          value={type}
          onChange={(e) => setType(e.target.value as keyof typeof DSR_TYPES)}
        >
          {Object.entries(DSR_TYPES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField id="dsr-details" label="Detalhes" hint="Opcional">
        <Textarea
          rows={3}
          maxLength={3000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </FormField>
      <SubmitButton pending={pending} variant="outline">
        Enviar solicitação
      </SubmitButton>
    </form>
  );
}
