import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

const valid = {
  fullName: "Maria Silva",
  email: "  Maria@Example.com ",
  phone: "(11) 98888-7777",
  document: "529.982.247-25",
  companyName: "",
  accountType: "advertiser" as const,
  password: "senhaSegura123",
  confirmPassword: "senhaSegura123",
  acceptTerms: true as const,
};

describe("signUpSchema", () => {
  it("normaliza e-mail, telefone e documento", () => {
    const r = signUpSchema.parse(valid);
    expect(r.email).toBe("maria@example.com");
    expect(r.phone).toBe("11988887777");
    expect(r.document).toBe("52998224725");
  });

  it("exige senha forte e confirmação igual", () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: "curta1", confirmPassword: "curta1" }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({
        ...valid,
        password: "somenteletras",
        confirmPassword: "somenteletras",
      }).success,
    ).toBe(false);
    const mismatch = signUpSchema.safeParse({ ...valid, confirmPassword: "outraSenha123" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("não aceita tipo de conta administrador", () => {
    expect(signUpSchema.safeParse({ ...valid, accountType: "admin" }).success).toBe(false);
  });

  it("exige aceite dos termos", () => {
    expect(signUpSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });

  it("rejeita documento inválido, mas aceita vazio", () => {
    expect(signUpSchema.safeParse({ ...valid, document: "111.111.111-11" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, document: "" }).success).toBe(true);
  });
});

describe("signInSchema", () => {
  it("valida e-mail", () => {
    expect(signInSchema.safeParse({ email: "x", password: "a" }).success).toBe(false);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "a" }).success).toBe(true);
  });
});
