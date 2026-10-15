import { onlyDigits } from "@/lib/utils";

/** Mesmo algoritmo de private.is_valid_cpf (banco). */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map(Number);
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += digits[i]! * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === digits[9] && calc(10) === digits[10];
}

/** Mesmo algoritmo de private.is_valid_cnpj (banco). */
export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digits = cnpj.split("").map(Number);
  const calc = (weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + digits[i]! * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === digits[12] && d2 === digits[13];
}

export type DocumentKind = "cpf" | "cnpj";

export function detectDocument(value: string): { kind: DocumentKind; digits: string } | null {
  const digits = onlyDigits(value);
  if (digits.length === 11 && isValidCpf(digits)) return { kind: "cpf", digits };
  if (digits.length === 14 && isValidCnpj(digits)) return { kind: "cnpj", digits };
  return null;
}

export function formatDocument(digits: string): string {
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return digits;
}

export function formatPhone(digits: string): string {
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return digits;
}
