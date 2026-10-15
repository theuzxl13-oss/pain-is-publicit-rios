import { Alert } from "@/components/ui/alert";

type SearchParams = Record<string, string | string[] | undefined>;

/** Mensagens transitórias vindas de redirecionamentos (?email=confirmado etc.). */
export function FlashMessages({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      {searchParams.email === "confirmado" && (
        <Alert variant="success" title="E-mail confirmado. Bem-vindo(a)!" />
      )}
      {searchParams.senha === "atualizada" && (
        <Alert variant="success" title="Senha atualizada com sucesso." />
      )}
      {searchParams.acesso === "negado" && (
        <Alert variant="warning" title="Você não tem permissão para acessar aquela área." />
      )}
    </>
  );
}
