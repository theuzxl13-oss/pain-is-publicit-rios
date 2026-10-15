export const BILLING_UNITS = ["day", "week", "fortnight", "month"] as const;
export type BillingUnit = (typeof BILLING_UNITS)[number];

export const BILLING_UNIT_LABELS: Record<
  BillingUnit,
  { singular: string; plural: string; per: string }
> = {
  day: { singular: "dia", plural: "dias", per: "por dia" },
  week: { singular: "semana", plural: "semanas", per: "por semana" },
  fortnight: { singular: "bissemana", plural: "bissemanas", per: "por bissemana (14 dias)" },
  month: { singular: "mês", plural: "meses", per: "por mês" },
};

const UNIT_DAYS: Record<Exclude<BillingUnit, "month">, number> = { day: 1, week: 7, fortnight: 14 };

/** Número de dias de um período fechado [start, end] em datas ISO (YYYY-MM-DD). */
export function inclusiveDays(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) throw new Error("Data inválida");
  if (b < a) throw new Error("A data final deve ser igual ou posterior à inicial");
  return Math.round((b - a) / 86_400_000) + 1;
}

/** Meses de calendário cobertos, arredondando frações para cima (mês comercial). */
function monthsCovered(start: string, end: string): number {
  const [sy, sm, sd] = start.split("-").map(Number) as [number, number, number];
  const endPlusOne = new Date(Date.parse(`${end}T00:00:00Z`) + 86_400_000);
  const ey = endPlusOne.getUTCFullYear();
  const em = endPlusOne.getUTCMonth() + 1;
  const ed = endPlusOne.getUTCDate();
  let months = (ey - sy) * 12 + (em - sm);
  if (ed > sd) months += 1;
  return Math.max(1, months);
}

export type PriceEstimate = {
  days: number;
  periods: number;
  billedPeriods: number; // respeita o mínimo de períodos
  unitPriceCents: number;
  totalCents: number;
  belowMinimum: boolean;
};

/**
 * Estimativa de valor para um período, conforme a unidade de cobrança do painel.
 * Frações de período são cobradas como período inteiro. Valor final pode
 * ser negociado (proposta/contraproposta).
 */
export function estimatePrice(params: {
  unitPriceCents: number;
  unit: BillingUnit;
  minPeriods: number;
  start: string;
  end: string;
}): PriceEstimate {
  const { unitPriceCents, unit, minPeriods, start, end } = params;
  const days = inclusiveDays(start, end);
  const periods = unit === "month" ? monthsCovered(start, end) : Math.ceil(days / UNIT_DAYS[unit]);
  const billedPeriods = Math.max(periods, minPeriods);
  return {
    days,
    periods,
    billedPeriods,
    unitPriceCents,
    totalCents: billedPeriods * unitPriceCents,
    belowMinimum: periods < minPeriods,
  };
}
