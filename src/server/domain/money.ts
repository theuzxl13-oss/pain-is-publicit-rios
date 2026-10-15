const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Todos os valores monetários trafegam como inteiros em centavos. */
export function formatCents(cents: number): string {
  return brl.format(cents / 100);
}

export function reaisToCents(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Valor inválido");
  return Math.round(value * 100);
}

/** Percentual com 2 casas sobre centavos, arredondando meio para cima. */
export function percentOf(cents: number, percent: number): number {
  return Math.round((cents * Math.round(percent * 100)) / 10000);
}
