"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORT_TOPICS, supportSchema, type SupportInput } from "@/lib/validation/support";
import { submitSupportTicket } from "./actions";

export function SupportForm({ defaults }: { defaults: Partial<SupportInput> }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const form = useForm<SupportInput>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      website: "",
      ...defaults,
      // "" exibe a opção "Selecione"; o schema exige um assunto válido.
      topic: defaults.topic ?? ("" as SupportInput["topic"]),
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setResult(null);
    startTransition(async () => {
      const res = await submitSupportTicket(values);
      if (res.ok) {
        form.reset({ ...values, subject: "", message: "" });
        setResult({
          ok: true,
          message: `Recebemos sua mensagem. Protocolo: ${res.data?.code}. Responderemos por e-mail.`,
        });
      } else {
        Object.entries(res.fieldErrors ?? {}).forEach(([field, message]) =>
          form.setError(field as keyof SupportInput, { message }),
        );
        setResult({ ok: false, message: res.error });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {result && (
        <Alert
          variant={result.ok ? "success" : "destructive"}
          title={result.ok ? "Mensagem enviada" : "Não foi possível enviar"}
        >
          {result.message}
        </Alert>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="name" label="Nome" required error={errors.name?.message}>
          <Input autoComplete="name" {...form.register("name")} />
        </FormField>
        <FormField id="email" label="E-mail" required error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...form.register("email")} />
        </FormField>
        <FormField id="phone" label="Telefone" hint="Opcional" error={errors.phone?.message}>
          <Input type="tel" autoComplete="tel" inputMode="tel" {...form.register("phone")} />
        </FormField>
        <FormField id="topic" label="Assunto" required error={errors.topic?.message}>
          <NativeSelect {...form.register("topic")}>
            <option value="">Selecione</option>
            {Object.entries(SUPPORT_TOPICS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <FormField id="subject" label="Título" required error={errors.subject?.message}>
        <Input maxLength={160} {...form.register("subject")} />
      </FormField>
      <FormField id="message" label="Mensagem" required error={errors.message?.message}>
        <Textarea rows={6} maxLength={5000} {...form.register("message")} />
      </FormField>
      <div aria-hidden className="hidden">
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
      </div>
      <SubmitButton pending={pending} size="lg" className="w-full sm:w-auto">
        Enviar mensagem
      </SubmitButton>
    </form>
  );
}
