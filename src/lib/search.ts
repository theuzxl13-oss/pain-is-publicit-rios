/** Remove caracteres com significado na sintaxe de filtros do PostgREST (evita injeção de filtros). */
export function sanitizeSearchTerm(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/[,()*%\\:"'.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
