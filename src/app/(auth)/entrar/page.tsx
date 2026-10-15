import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";
import { safeRedirectPath } from "@/lib/utils";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const MESSAGES: Record<string, { variant: "destructive" | "warning"; text: string }> = {
  link_invalido: {
    variant: "destructive",
    text: "O link é inválido ou expirou. Solicite um novo.",
  },
  configuracao: {
    variant: "warning",
    text: "A autenticação ainda não foi configurada neste ambiente.",
  },
};

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? safeRedirectPath(sp.next, "") || undefined : undefined;
  const message = typeof sp.erro === "string" ? MESSAGES[sp.erro] : undefined;

  return (
    <>
      <h1 className="text-3xl font-bold">Entrar</h1>
      <p className="mt-2 text-muted-foreground">
        Acesse sua conta para gerenciar painéis, solicitações e reservas.
      </p>
      <div className="mt-8 space-y-4">
        {!isSupabaseConfigured() && (
          <Alert variant="warning" title="Ambiente sem Supabase configurado">
            Defina as variáveis de ambiente do Supabase (veja <code>.env.example</code>) para
            habilitar o login.
          </Alert>
        )}
        {message && <Alert variant={message.variant} title={message.text} />}
        <SignInForm next={next} />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </>
  );
}
