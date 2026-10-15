import { z } from "zod";
import { emailSchema, phoneSchema } from "./auth";

export const SUPPORT_TOPICS = {
  duvida: "Dúvida geral",
  comercial: "Contato comercial",
  financeiro: "Pagamentos e repasses",
  tecnico: "Problema técnico",
  denuncia: "Denúncia de anúncio",
  privacidade: "Privacidade e dados pessoais (LGPD)",
  outro: "Outro assunto",
} as const;

export const supportSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: emailSchema,
  phone: phoneSchema,
  topic: z.enum(
    Object.keys(SUPPORT_TOPICS) as [
      keyof typeof SUPPORT_TOPICS,
      ...(keyof typeof SUPPORT_TOPICS)[],
    ],
    {
      errorMap: () => ({ message: "Escolha um assunto" }),
    },
  ),
  subject: z.string().trim().min(3, "Informe o assunto").max(160),
  message: z.string().trim().min(10, "Descreva sua solicitação (mín. 10 caracteres)").max(5000),
  // Honeypot anti-spam: deve permanecer vazio.
  website: z.string().max(0).optional().default(""),
});
export type SupportInput = z.input<typeof supportSchema>;
