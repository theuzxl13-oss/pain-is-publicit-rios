import { z } from "zod";
import { onlyDigits } from "@/lib/utils";
import { detectDocument } from "./document";

export const emailSchema = z
  .string({ required_error: "Informe seu e-mail" })
  .trim()
  .toLowerCase()
  .min(1, "Informe seu e-mail")
  .max(254, "E-mail muito longo")
  .email("E-mail inválido");

/** Política de senha: mínimo 10 caracteres, com letras e números. */
export const passwordSchema = z
  .string({ required_error: "Informe uma senha" })
  .min(10, "A senha deve ter pelo menos 10 caracteres")
  .max(72, "A senha deve ter no máximo 72 caracteres")
  .regex(/[A-Za-z]/, "A senha deve conter letras")
  .regex(/\d/, "A senha deve conter números");

export const phoneSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((v) => v === "" || /^\d{10,11}$/.test(v), "Telefone inválido (DDD + número)");

/** CPF ou CNPJ opcional; quando informado precisa ser válido. */
export const optionalDocumentSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((v) => v === "" || detectDocument(v) !== null, "CPF ou CNPJ inválido");

export const accountTypeSchema = z.enum(["advertiser", "owner", "both"], {
  errorMap: () => ({ message: "Escolha o tipo de conta" }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe sua senha").max(72),
});
export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo").max(120),
    email: emailSchema,
    phone: phoneSchema,
    document: optionalDocumentSchema,
    companyName: z.string().trim().max(160).optional().default(""),
    accountType: accountTypeSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "É necessário aceitar os termos de uso e a política de privacidade",
      }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });
export type SignUpInput = z.input<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
