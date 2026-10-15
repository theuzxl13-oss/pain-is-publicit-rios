import { Alert } from "@/components/ui/alert";

/** Página jurídica em RASCUNHO: exige revisão por profissional habilitado antes do lançamento. */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article className="container max-w-3xl py-12 sm:py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {updatedAt}</p>
      <Alert variant="warning" title="Documento em rascunho" className="my-8">
        Este texto é uma minuta provisória e será revisado por assessoria jurídica antes do
        lançamento comercial.
      </Alert>
      <div className="prose-legal">{children}</div>
    </article>
  );
}
