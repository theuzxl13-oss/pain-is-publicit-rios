import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl font-extrabold text-primary">404</p>
        <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          O endereço pode ter mudado ou o anúncio não está mais disponível.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Ir para o início</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/explorar">Explorar painéis</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
