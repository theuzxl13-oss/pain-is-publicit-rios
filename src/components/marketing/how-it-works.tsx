import { CreditCard, FileSignature, MessagesSquare, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Encontre",
    text: "Pesquise por cidade, região ou tipo de painel e compare localizações, dimensões e preços.",
  },
  {
    icon: MessagesSquare,
    title: "Solicite e negocie",
    text: "Envie sua solicitação com o período desejado. O proprietário aprova ou envia uma contraproposta.",
  },
  {
    icon: FileSignature,
    title: "Contrate",
    text: "Revise o resumo da contratação, aceite os termos e siga para o pagamento seguro.",
  },
  {
    icon: CreditCard,
    title: "Pague e veicule",
    text: "Pague via Pix ou cartão. Após a confirmação, o período fica reservado para sua campanha.",
  },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step.title} className="relative rounded-xl border bg-card p-6 shadow-soft">
          <span className="absolute right-5 top-5 font-display text-4xl font-bold text-muted">
            {i + 1}
          </span>
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <step.icon aria-hidden className="h-5 w-5" />
          </span>
          <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
