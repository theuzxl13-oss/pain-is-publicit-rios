import type { Metadata } from "next";
import Link from "next/link";
import { FileText, LifeBuoy, ShieldCheck, Undo2 } from "lucide-react";
import { Faq } from "@/components/marketing/faq";
import { Section } from "@/components/marketing/section";

export const metadata: Metadata = { title: "Central de ajuda" };

const topics = [
  {
    href: "/suporte",
    icon: LifeBuoy,
    title: "Abrir um chamado",
    text: "Fale com nossa equipe de suporte.",
  },
  { href: "/cancelamento", icon: Undo2, title: "Cancelamentos", text: "Prazos e reembolsos." },
  { href: "/termos", icon: FileText, title: "Termos de uso", text: "Regras de uso da plataforma." },
  {
    href: "/privacidade",
    icon: ShieldCheck,
    title: "Privacidade",
    text: "Como tratamos seus dados (LGPD).",
  },
];

export default function HelpPage() {
  return (
    <Section
      as="h1"
      title="Central de ajuda"
      description="Encontre respostas rápidas ou fale com a nossa equipe."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="flex h-full flex-col gap-3 rounded-xl border bg-card p-5 shadow-soft transition hover:border-primary/40"
            >
              <t.icon aria-hidden className="h-6 w-6 text-primary" />
              <span className="font-semibold">{t.title}</span>
              <span className="text-sm text-muted-foreground">{t.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div id="perguntas-frequentes" className="mx-auto mt-16 max-w-3xl scroll-mt-24">
        <h2 className="mb-6 text-2xl font-bold">Perguntas frequentes</h2>
        <Faq />
      </div>
    </Section>
  );
}
