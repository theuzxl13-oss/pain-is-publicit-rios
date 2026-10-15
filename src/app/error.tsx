"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-muted-foreground">
          Não conseguimos concluir esta ação. Tente novamente; se o problema continuar, fale com o
          suporte.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground">Código: {error.digest}</p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button asChild variant="outline">
            <Link href="/suporte">Suporte</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
