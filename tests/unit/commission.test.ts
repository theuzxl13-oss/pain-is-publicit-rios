import { describe, expect, it } from "vitest";
import { calculateCommission } from "@/server/domain/commission";
import { formatCents, percentOf } from "@/server/domain/money";

describe("calculateCommission", () => {
  it("exemplo do requisito: R$ 2.000,00 com 10%", () => {
    const r = calculateCommission(200_000, { percent: 10, fixedCents: 0, chargedTo: "owner" });
    expect(r.commissionCents).toBe(20_000);
    expect(r.netOwnerCents).toBe(180_000);
    expect(r.advertiserTotalCents).toBe(200_000);
  });

  it("soma comissão fixa e abate taxa do intermediador do proprietário", () => {
    const r = calculateCommission(
      100_000,
      { percent: 5, fixedCents: 1_000, chargedTo: "owner" },
      499,
    );
    expect(r.commissionCents).toBe(6_000);
    expect(r.netOwnerCents).toBe(100_000 - 6_000 - 499);
  });

  it("comissão cobrada do anunciante aumenta o total pago, não reduz o líquido", () => {
    const r = calculateCommission(100_000, { percent: 10, fixedCents: 0, chargedTo: "advertiser" });
    expect(r.advertiserTotalCents).toBe(110_000);
    expect(r.netOwnerCents).toBe(100_000);
  });

  it("sem regra não há comissão", () => {
    expect(calculateCommission(5_000, null).commissionCents).toBe(0);
  });

  it("comissão do proprietário nunca excede o bruto e líquido nunca é negativo", () => {
    const r = calculateCommission(1_000, { percent: 0, fixedCents: 5_000, chargedTo: "owner" });
    expect(r.commissionCents).toBe(1_000);
    expect(r.netOwnerCents).toBe(0);
  });

  it("rejeita valores não inteiros (centavos)", () => {
    expect(() => calculateCommission(10.5, null)).toThrow();
  });
});

describe("money", () => {
  it("arredonda percentuais em centavos", () => {
    expect(percentOf(333, 10)).toBe(33);
    expect(percentOf(335, 10)).toBe(34);
    expect(percentOf(100_000, 12.5)).toBe(12_500);
  });
  it("formata em reais", () => {
    expect(formatCents(200_000).replace(/\s/g, " ")).toBe("R$ 2.000,00");
  });
});
