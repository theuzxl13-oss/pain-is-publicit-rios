import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Termos de uso" };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso" updatedAt="15/10/2026">
      <h2>1. Objeto</h2>
      <p>
        A {siteConfig.name} é um marketplace que aproxima proprietários de painéis publicitários e
        anunciantes, oferecendo ferramentas de busca, negociação, contratação e pagamento. A
        plataforma não é proprietária dos painéis anunciados.
      </p>
      <h2>2. Cadastro</h2>
      <ul>
        <li>O usuário deve fornecer informações verdadeiras e mantê-las atualizadas.</li>
        <li>
          A conta é pessoal e intransferível; o usuário é responsável pela guarda de sua senha.
        </li>
        <li>Permissões administrativas não podem ser solicitadas pelo próprio usuário.</li>
      </ul>
      <h2>3. Anúncios de painéis</h2>
      <p>
        O proprietário declara possuir o direito de explorar comercialmente o espaço anunciado e se
        responsabiliza pela veracidade das informações, fotos, preços e disponibilidade. Os anúncios
        passam por análise antes da publicação e podem ser suspensos em caso de irregularidade.
      </p>
      <h2>4. Contratação e pagamento</h2>
      <p>
        A reserva somente é confirmada após a confirmação do pagamento pelo intermediador. Valores,
        comissões e prazos de repasse seguem as regras vigentes no momento da contratação e são
        exibidos no resumo antes do aceite.
      </p>
      <h2>5. Cancelamentos</h2>
      <p>Aplicam-se as regras da Política de Cancelamento.</p>
      <h2>6. Conteúdo das campanhas</h2>
      <p>
        O anunciante é responsável pelo conteúdo veiculado, que deve respeitar a legislação, o CONAR
        e as normas municipais aplicáveis à publicidade exterior.
      </p>
      <h2>7. Foro</h2>
      <p>A definir pela assessoria jurídica.</p>
    </LegalPage>
  );
}
