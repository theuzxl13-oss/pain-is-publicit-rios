import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-8">
        <Logo />
        <main id="conteudo" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </main>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/termos" className="hover:underline">
            Termos de uso
          </Link>{" "}
          ·{" "}
          <Link href="/privacidade" className="hover:underline">
            Privacidade
          </Link>{" "}
          ·{" "}
          <Link href="/suporte" className="hover:underline">
            Suporte
          </Link>
        </p>
      </div>
      <aside
        className="relative hidden overflow-hidden bg-ink text-ink-foreground lg:block"
        aria-hidden
      >
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-primary/50 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <blockquote className="max-w-md">
            <p className="font-display text-3xl font-bold leading-tight text-white">
              Painéis publicitários, negociação e pagamento em um só lugar.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-foreground/70">
              <ShieldCheck className="h-4 w-4 text-accent" /> Seus dados protegidos conforme a LGPD.
            </p>
          </blockquote>
        </div>
      </aside>
    </div>
  );
}
