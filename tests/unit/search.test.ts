import { describe, expect, it } from "vitest";
import { sanitizeSearchTerm } from "@/lib/search";

describe("sanitizeSearchTerm", () => {
  it("remove sintaxe de filtro do PostgREST", () => {
    expect(sanitizeSearchTerm("sp,status.eq.draft")).toBe("sp status eq draft");
    expect(sanitizeSearchTerm("a),or(b")).toBe("a or b");
    expect(sanitizeSearchTerm("100%")).toBe("100");
  });
  it("limita o tamanho e trata vazio", () => {
    expect(sanitizeSearchTerm("x".repeat(200))).toHaveLength(80);
    expect(sanitizeSearchTerm(undefined)).toBe("");
  });
  it("preserva acentos", () => {
    expect(sanitizeSearchTerm("  São   Paulo ")).toBe("São Paulo");
  });
});
