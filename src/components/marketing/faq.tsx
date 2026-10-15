import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

export const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "Como funciona a contratação de um painel?",
    a: "Você encontra o painel, escolhe o período e envia uma solicitação. O proprietário pode aprovar, recusar ou enviar uma contraproposta. Com tudo acordado, você aceita os termos e paga pela plataforma. A reserva só é confirmada após a confirmação segura do pagamento.",
  },
  {
    q: "Quais formas de pagamento são aceitas?",
    a: "Pix e cartão de crédito, processados pelo checkout seguro do intermediador de pagamentos. A plataforma não armazena dados de cartão.",
  },
  {
    q: "Posso cancelar uma reserva?",
    a: "Sim, conforme a política de cancelamento vigente no momento da contratação. Consulte a página Política de cancelamento para os prazos e eventuais reembolsos.",
  },
  {
    q: "Quem instala a arte no painel?",
    a: "Isso depende das condições de cada painel, informadas pelo proprietário na página do anúncio e no resumo da contratação.",
  },
  {
    q: "Como cadastro meu painel?",
    a: "Crie uma conta como proprietário, cadastre o painel com fotos, localização e preço, e envie para análise. Após a aprovação da equipe, o anúncio fica visível para anunciantes de todo o país.",
  },
  {
    q: "Quando o proprietário recebe o valor da locação?",
    a: "O valor fica retido pela plataforma e é repassado ao proprietário após o início da veiculação, descontadas a comissão e as taxas aplicáveis, conforme as regras comerciais vigentes.",
  },
];

export function Faq({ items = DEFAULT_FAQ }: { items?: FaqItem[] }) {
  return (
    <div className="divide-y rounded-xl border bg-card">
      {items.map((item) => (
        <details key={item.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
            {item.q}
            <ChevronDown
              aria-hidden
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
