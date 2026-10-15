import { describe, expect, it } from "vitest";
import { estimatePrice, inclusiveDays } from "@/server/domain/pricing";

describe("inclusiveDays", () => {
  it("conta dias inclusivos", () => {
    expect(inclusiveDays("2027-01-01", "2027-01-01")).toBe(1);
    expect(inclusiveDays("2027-01-01", "2027-01-31")).toBe(31);
  });
  it("rejeita fim antes do início", () => {
    expect(() => inclusiveDays("2027-01-10", "2027-01-01")).toThrow();
  });
});

describe("estimatePrice", () => {
  const base = { unitPriceCents: 10_000, minPeriods: 1 };

  it("cobra frações de semana como semana inteira", () => {
    const r = estimatePrice({ ...base, unit: "week", start: "2027-01-01", end: "2027-01-10" });
    expect(r.days).toBe(10);
    expect(r.periods).toBe(2);
    expect(r.totalCents).toBe(20_000);
  });

  it("mês comercial: 01/01 a 31/01 = 1 mês; 15/01 a 14/02 = 1 mês; 15/01 a 15/02 = 2 meses", () => {
    expect(
      estimatePrice({ ...base, unit: "month", start: "2027-01-01", end: "2027-01-31" }).periods,
    ).toBe(1);
    expect(
      estimatePrice({ ...base, unit: "month", start: "2027-01-15", end: "2027-02-14" }).periods,
    ).toBe(1);
    expect(
      estimatePrice({ ...base, unit: "month", start: "2027-01-15", end: "2027-02-15" }).periods,
    ).toBe(2);
  });

  it("aplica o prazo mínimo", () => {
    const r = estimatePrice({
      unitPriceCents: 5_000,
      minPeriods: 7,
      unit: "day",
      start: "2027-03-01",
      end: "2027-03-03",
    });
    expect(r.belowMinimum).toBe(true);
    expect(r.billedPeriods).toBe(7);
    expect(r.totalCents).toBe(35_000);
  });

  it("bissemana = 14 dias", () => {
    expect(
      estimatePrice({ ...base, unit: "fortnight", start: "2027-01-01", end: "2027-01-15" }).periods,
    ).toBe(2);
  });
});
