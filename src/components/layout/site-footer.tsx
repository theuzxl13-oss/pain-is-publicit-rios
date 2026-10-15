import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "./logo";

const groups = [
  {
    title: "Plataforma",
    links: [
      { href: "/explorar", label: "Explorar painéis" },
      { href: "/como-funciona", label: "Como funciona" },
      { href: "/anuncie", label: "Anuncie seu painel" },
      { href: "/cadastro", label: "Criar conta" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/ajuda", label: "Central de ajuda" },
      { href: "/ajuda#perguntas-frequentes", label: "Perguntas frequentes" },
      { href: "/suporte", label: "Suporte" },
      { href: "/suporte?assunto=comercial", label: "Contato comercial" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/termos", label: "Termos de uso" },
      { href: "/privacidade", label: "Política de privacidade" },
      { href: "/cancelamento", label: "Política de cancelamento" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t bg-ink text-ink-foreground">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Logo inverse />
          <p className="max-w-xs text-sm text-ink-foreground/70">{siteConfig.description}</p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-white">{group.title}</h2>
            <ul className="mt-4 space-y-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-foreground/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-ink-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Todos os direitos reservados.
          </p>
          <p>
            Pagamentos processados por intermediador certificado. Não armazenamos dados de cartão.
          </p>
        </div>
      </div>
    </footer>
  );
}
