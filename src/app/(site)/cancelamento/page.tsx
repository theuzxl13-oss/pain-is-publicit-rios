import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Política de cancelamento" };

export default function CancellationPage() {
  return (
    <LegalPage title="Política de cancelamento" updatedAt="15/10/2026">
      <p>
        <strong>Regra provisória</strong>, sujeita à aprovação comercial (ver decisões pendentes do
        projeto):
      </p>
      <h2>Cancelamento pelo anunciante</h2>
      <ul>
        <li>Antes do pagamento: sem custo.</li>
        <li>
          Após o pagamento e com mais de 15 dias para o início: reembolso integral, descontadas
          taxas não recuperáveis do intermediador.
        </li>
        <li>Entre 15 e 7 dias do início: reembolso de 50%.</li>
        <li>
          A menos de 7 dias do início ou após o início: sem reembolso, salvo acordo entre as partes.
        </li>
      </ul>
      <h2>Cancelamento pelo proprietário</h2>
      <ul>
        <li>Reembolso integral ao anunciante, em qualquer prazo.</li>
        <li>Cancelamentos recorrentes podem levar à suspensão do anúncio.</li>
      </ul>
      <h2>Indisponibilidade do painel</h2>
      <p>
        Se o painel ficar indisponível por motivo alheio ao anunciante (dano, obra, determinação
        pública), o período não veiculado será reembolsado proporcionalmente ou remarcado, a
        critério do anunciante.
      </p>
    </LegalPage>
  );
}
