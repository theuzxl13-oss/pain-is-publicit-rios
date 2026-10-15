import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/utils";
import { isAuthPage, isProtectedPath } from "@/server/domain/routes";
import { canAccessArea, defaultDashboardPath, isAppRole } from "@/server/domain/roles";

describe("canAccessArea", () => {
  it("restringe áreas por papel", () => {
    expect(canAccessArea(["advertiser"], "advertiser")).toBe(true);
    expect(canAccessArea(["advertiser"], "owner")).toBe(false);
    expect(canAccessArea(["advertiser", "owner"], "admin")).toBe(false);
    expect(canAccessArea(["admin"], "admin")).toBe(true);
    expect(canAccessArea([], "account")).toBe(true);
  });

  it("conta suspensa só acessa a própria conta", () => {
    expect(canAccessArea(["admin"], "admin", false)).toBe(false);
    expect(canAccessArea(["owner"], "account", false)).toBe(true);
  });
});

describe("defaultDashboardPath", () => {
  it("escolhe o destino conforme os papéis", () => {
    expect(defaultDashboardPath(["admin", "owner"])).toBe("/admin");
    expect(defaultDashboardPath(["owner"])).toBe("/painel/proprietario");
    expect(defaultDashboardPath(["advertiser", "owner"])).toBe("/painel/anunciante");
    expect(defaultDashboardPath([])).toBe("/conta");
  });
});

describe("isAppRole", () => {
  it("valida valores vindos do banco", () => {
    expect(isAppRole("owner")).toBe(true);
    expect(isAppRole("superuser")).toBe(false);
    expect(isAppRole(undefined)).toBe(false);
  });
});

describe("rotas protegidas", () => {
  it("identifica prefixos protegidos sem falsos positivos", () => {
    expect(isProtectedPath("/painel")).toBe(true);
    expect(isProtectedPath("/painel/proprietario")).toBe(true);
    expect(isProtectedPath("/admin/usuarios")).toBe(true);
    expect(isProtectedPath("/conta")).toBe(true);
    expect(isProtectedPath("/paineis/outdoor-paulista")).toBe(false);
    expect(isProtectedPath("/administracao-publica")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });
  it("identifica páginas de autenticação", () => {
    expect(isAuthPage("/entrar")).toBe(true);
    expect(isAuthPage("/cadastro")).toBe(true);
    expect(isAuthPage("/redefinir-senha")).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("bloqueia open redirect", () => {
    expect(safeRedirectPath("/painel/anunciante")).toBe("/painel/anunciante");
    expect(safeRedirectPath("//evil.com")).toBe("/painel");
    expect(safeRedirectPath("https://evil.com")).toBe("/painel");
    expect(safeRedirectPath("/\\evil.com")).toBe("/painel");
    expect(safeRedirectPath(undefined, "/conta")).toBe("/conta");
  });
});
