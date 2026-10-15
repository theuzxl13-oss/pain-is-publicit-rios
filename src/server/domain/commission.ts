import { percentOf } from "./money";

export type CommissionRule = {
  id?: string;
  percent: number; // 0..100
  fixedCents: number;
  chargedTo: "owner" | "advertiser";
};

export type CommissionBreakdown = {
  grossCents: number;
  commissionCents: number;
  gatewayFeeCents: number;
  /** Valor líquido teórico do proprietário, antes de tributos. */
  netOwnerCents: number;
  /** Total cobrado do anunciante (inclui comissão quando ela é paga por ele). */
  advertiserTotalCents: number;
};

/**
 * Calcula comissão e valores líquidos de uma locação.
 * Exemplo: R$ 2.000,00 com 10% → comissão R$ 200,00, líquido R$ 1.800,00.
 * A taxa do intermediador é abatida do proprietário (regra PROVISÓRIA — ver docs/DECISOES.md).
 */
export function calculateCommission(
  grossCents: number,
  rule: CommissionRule | null,
  gatewayFeeCents = 0,
): CommissionBreakdown {
  if (!Number.isInteger(grossCents) || grossCents < 0) throw new Error("grossCents inválido");
  if (!Number.isInteger(gatewayFeeCents) || gatewayFeeCents < 0) {
    throw new Error("gatewayFeeCents inválido");
  }

  const commissionRaw = rule ? percentOf(grossCents, rule.percent) + rule.fixedCents : 0;
  // Comissão cobrada do proprietário nunca excede o valor bruto.
  const commissionCents =
    rule?.chargedTo === "advertiser" ? commissionRaw : Math.min(commissionRaw, grossCents);

  if (rule?.chargedTo === "advertiser") {
    return {
      grossCents,
      commissionCents,
      gatewayFeeCents,
      netOwnerCents: Math.max(0, grossCents - gatewayFeeCents),
      advertiserTotalCents: grossCents + commissionCents,
    };
  }

  return {
    grossCents,
    commissionCents,
    gatewayFeeCents,
    netOwnerCents: Math.max(0, grossCents - commissionCents - gatewayFeeCents),
    advertiserTotalCents: grossCents,
  };
}
