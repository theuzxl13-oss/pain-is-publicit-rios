import type { ZodError } from "zod";
import type { FieldErrors } from "@/types/actions";

/** Converte erros do Zod para { campo: primeira mensagem }. */
export function zodFieldErrors(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
