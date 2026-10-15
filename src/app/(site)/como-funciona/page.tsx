import type { Metadata } from "next";
import Link from "next/link";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { RENTAL_STATUS_LABELS, type RentalStatus } from "@/server/domain/rental-status";

export const metadata: Metadata = { title: "Como funciona" };

const flow: { status: RentalStatus; text: string }[] = [
  { status: "submitted", text: "O anunciante escolhe o painel, o período e descreve a campanha." },
  {
    status: "under_review",
    text: "O proprietário analisa e pode aprovar, recusar, contrapropor ou pedir informações.",
  },
  {
    status: "negotiating",
    text: "Propostas e contrapropostas ficam registradas com valores, datas e condições.",
  },
  {
    status: "awaiting_payment",
    text: "Com o acordo fechado, o anunciante aceita os termos e o período fica reservado temporariamente durante o pagamento.",
  },
  {
    status: "confirmed",
    text: "Após a confirmação segura do pagamento pelo intermediador, a reserva é confirmada e o período bloqueado.",
  },
  { status: "in_progress", text: "A campanha é veiculada no período contratado." },
  {
    status: "completed",
    text: "Fim do período. O repasse ao proprietário segue as regras comerciais vigentes.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section
        as="h1"
        title="Como funciona"
        description="Toda a negociação, contratação e pagamento acontecem dentro da plataforma, com histórico registrado."
      >
        <HowItWorks />
      </Section>
      <Section title="Etapas de uma locação" className="bg-secondary/50">
        <ol className="mx-auto max-w-3xl space-y-4">
          {flow.map((step, i) => (
            <li key={step.status} className="flex gap-4 rounded-xl border bg-card p-5 shadow-soft">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold">{RENTAL_STATUS_LABELS[step.status]}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mx-auto mt-6 max-w-3xl text-sm text-muted-foreground">
          Solicitações sem resposta expiram automaticamente e não bloqueiam o calendário. Um mesmo
          painel nunca pode ter duas reservas confirmadas para períodos que se sobrepõem.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/explorar">Explorar painéis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/anuncie">Sou proprietário</Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
