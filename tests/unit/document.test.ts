import { describe, expect, it } from "vitest";
import { detectDocument, formatDocument, isValidCnpj, isValidCpf } from "@/lib/validation/document";

describe("CPF", () => {
  it("aceita CPF válido com ou sem máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });
  it("rejeita dígitos verificadores errados e sequências repetidas", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });
});

describe("CNPJ", () => {
  it("aceita CNPJ válido", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
  });
  it("rejeita CNPJ inválido", () => {
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });
});

describe("detectDocument / formatDocument", () => {
  it("detecta o tipo pelo tamanho e validade", () => {
    expect(detectDocument("529.982.247-25")).toEqual({ kind: "cpf", digits: "52998224725" });
    expect(detectDocument("11222333000181")).toEqual({ kind: "cnpj", digits: "11222333000181" });
    expect(detectDocument("52998224724")).toBeNull();
  });
  it("formata", () => {
    expect(formatDocument("52998224725")).toBe("529.982.247-25");
    expect(formatDocument("11222333000181")).toBe("11.222.333/0001-81");
  });
});
