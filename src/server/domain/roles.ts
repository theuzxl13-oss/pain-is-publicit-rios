export const APP_ROLES = ["advertiser", "owner", "admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Papéis que o próprio usuário pode habilitar. "admin" nunca. */
export const SELF_SERVICE_ROLES = ["advertiser", "owner"] as const satisfies readonly AppRole[];
export type SelfServiceRole = (typeof SELF_SERVICE_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  advertiser: "Anunciante",
  owner: "Proprietário",
  admin: "Administrador",
};

export type Area = "advertiser" | "owner" | "admin" | "account";

const AREA_ROLES: Record<Area, readonly AppRole[] | "any"> = {
  account: "any",
  advertiser: ["advertiser"],
  owner: ["owner"],
  admin: ["admin"],
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function canAccessArea(roles: readonly AppRole[], area: Area, active = true): boolean {
  if (!active) return area === "account";
  const required = AREA_ROLES[area];
  if (required === "any") return true;
  return required.some((role) => roles.includes(role));
}

/** Destino padrão após o login, conforme os papéis do usuário. */
export function defaultDashboardPath(roles: readonly AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("owner") && !roles.includes("advertiser")) return "/painel/proprietario";
  if (roles.includes("advertiser")) return "/painel/anunciante";
  if (roles.includes("owner")) return "/painel/proprietario";
  return "/conta";
}
