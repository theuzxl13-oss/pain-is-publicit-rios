import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Anuncie seu painel" };

const steps = [
  "Crie sua conta como proprietário (gratuito).",
  "Cadastre o painel com fotos, endereço, dimensões, preço e regras.",
  "Nossa equipe revisa o anúncio antes da publicação.",
  "Receba solicitações, negocie e acompanhe reservas e valores pelo seu painel.",
];

export default function AdvertiseYourPanelPage() {
  return (
    <>
      <section className="bg-ink py-20 text-ink-foreground sm:py-28">
        <div className="container max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">
            Para proprietários
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-white sm:text-5xl">
            Seu painel na vitrine de quem está contratando agora
          </h1>
          <p className="mt-6 text-lg text-ink-foreground/75">
            Divulgue espaços publicitários para empresas, agências e anunciantes de todo o Brasil,
            com gestão de calendário, negociação e pagamentos centralizados.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="accent">
              <Link href="/cadastro?tipo=owner">Criar conta de proprietário</Link>
            </Button>
            <Button asChild size="lg" variant="inverse">
              <Link href="/suporte?assunto=comercial">Falar com o comercial</Link>
            </Button>
          </div>
        </div>
      </section>
      <Section title="Como começar">
        <ol className="mx-auto grid max-w-3xl gap-4">
          {steps.map((s) => (
            <li
              key={s}
              className="flex items-start gap-3 rounded-xl border bg-card p-5 shadow-soft"
            >
              <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-muted-foreground">
          Já tem conta como anunciante? Habilite o perfil de proprietário em{" "}
          <Link href="/conta" className="text-primary hover:underline">
            Minha conta
          </Link>
          .
        </p>
      </Section>
    </>
  );
}
