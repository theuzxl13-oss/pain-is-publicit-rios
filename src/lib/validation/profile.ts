import { z } from "zod";
import { optionalDocumentSchema, phoneSchema } from "./auth";

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo").max(120),
  phone: phoneSchema,
  document: optionalDocumentSchema,
  marketingOptIn: z.boolean().default(false),
});
export type ProfileInput = z.input<typeof profileSchema>;

export const companySchema = z.object({
  legalName: z.string().trim().min(2, "Informe a razão social").max(160),
  tradeName: z.string().trim().max(160).optional().default(""),
});
export type CompanyInput = z.input<typeof companySchema>;
