/**
 * Identidade da plataforma. O nome é provisório: altere aqui (e em
 * settings."public.platform_name" no banco) sem necessidade de reestruturação.
 */
export const siteConfig = {
  name: "Plataforma de Locação de Painéis Publicitários",
  shortName: "PainelHub",
  description:
    "Explore painéis publicitários disponíveis, compare localizações e contrate espaços de publicidade em uma única plataforma.",
  locale: "pt-BR",
  currency: "BRL",
} as const;

export const mainNav = [
  { href: "/", label: "Início" },
  { href: "/explorar", label: "Explorar painéis" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/anuncie", label: "Anuncie seu painel" },
  { href: "/suporte", label: "Suporte" },
] as const;
