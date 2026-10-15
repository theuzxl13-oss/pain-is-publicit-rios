import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { SUPPORT_TOPICS } from "@/lib/validation/support";
import { getSessionUser } from "@/server/auth/session";
import { SupportForm } from "./support-form";

export const metadata: Metadata = { title: "Suporte e contato" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SupportPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const user = await getSessionUser();
  const assunto =
    typeof sp.assunto === "string" && sp.assunto in SUPPORT_TOPICS
      ? (sp.assunto as keyof typeof SUPPORT_TOPICS)
      : undefined;
  const painel = typeof sp.painel === "string" ? sp.painel.slice(0, 140) : "";

  return (
    <div className="container grid gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.5fr]">
      <div>
        <h1 className="text-3xl font-bold sm:text-4xl">Suporte e contato</h1>
        <p className="mt-4 text-muted-foreground">
          Dúvidas, contato comercial, problemas técnicos ou solicitações sobre seus dados pessoais.
          Respondemos por e-mail em até 2 dias úteis.
        </p>
        <div className="mt-8 space-y-3 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail aria-hidden className="h-4 w-4" /> Você receberá um número de protocolo ao enviar.
          </p>
          <p className="text-muted-foreground">
            Antes de escrever, confira a{" "}
            <Link href="/ajuda" className="font-medium text-primary hover:underline">
              central de ajuda
            </Link>
            .
          </p>
          {user && (
            <p className="text-muted-foreground">Seus chamados ficam vinculados à sua conta.</p>
          )}
        </div>
      </div>
      <div className="rounded-xl border bg-card p-6 shadow-soft sm:p-8">
        <SupportForm
          defaults={{
            name: user?.profile?.fullName ?? "",
            email: user?.email ?? "",
            phone: user?.profile?.phone ?? "",
            topic: assunto,
            subject: painel ? `Interesse no painel ${painel}` : "",
          }}
        />
      </div>
    </div>
  );
}
