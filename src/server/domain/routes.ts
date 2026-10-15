/** Prefixos de rotas que exigem usuário autenticado. */
export const PROTECTED_PREFIXES = ["/painel", "/conta", "/admin"] as const;

/** Páginas de autenticação (usuário logado é redirecionado para a área logada). */
export const AUTH_PAGES = ["/entrar", "/cadastro"] as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((prefix) => matchesPrefix(pathname, prefix));
}
