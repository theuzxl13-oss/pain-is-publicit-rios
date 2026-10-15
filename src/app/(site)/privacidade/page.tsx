import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" updatedAt="15/10/2026">
      <h2>1. Dados coletados</h2>
      <ul>
        <li>Cadastro: nome, e-mail, telefone, CPF/CNPJ e nome da empresa.</li>
        <li>
          Operação: solicitações, propostas, reservas, aceites de contrato (com data, IP e
          navegador) e pagamentos.
        </li>
        <li>Técnicos: registros de acesso e segurança.</li>
      </ul>
      <p>
        Não armazenamos dados de cartão: o pagamento é processado diretamente pelo intermediador.
      </p>
      <h2>2. Finalidades e bases legais (LGPD)</h2>
      <ul>
        <li>Execução de contrato: cadastro, negociação, contratação e pagamentos.</li>
        <li>Obrigação legal: guarda de registros de acesso e documentos fiscais.</li>
        <li>Legítimo interesse: segurança, prevenção a fraudes e melhoria do serviço.</li>
        <li>Consentimento: comunicações de marketing (revogável a qualquer momento).</li>
      </ul>
      <h2>3. Compartilhamento</h2>
      <p>
        Com a outra parte da negociação (somente os dados necessários), com o intermediador de
        pagamentos e com provedores de infraestrutura (hospedagem, banco de dados, e-mail), sempre
        sob contrato.
      </p>
      <h2>4. Retenção</h2>
      <p>
        Dados de contas são mantidos enquanto a conta estiver ativa. Registros financeiros e
        contratuais são mantidos pelos prazos legais. Após o encerramento, dados não obrigatórios
        são anonimizados.
      </p>
      <h2>5. Direitos do titular</h2>
      <p>
        Você pode solicitar confirmação, acesso, correção, portabilidade, anonimização ou eliminação
        dos seus dados e revogar consentimentos. Usuários autenticados fazem a solicitação em{" "}
        <Link href="/conta" className="text-primary hover:underline">
          Minha conta
        </Link>
        ; demais titulares podem usar o{" "}
        <Link href="/suporte?assunto=privacidade" className="text-primary hover:underline">
          formulário de suporte
        </Link>{" "}
        (assunto “Privacidade”).
      </p>
      <h2>6. Encarregado (DPO)</h2>
      <p>Contato a ser definido antes do lançamento.</p>
    </LegalPage>
  );
}
