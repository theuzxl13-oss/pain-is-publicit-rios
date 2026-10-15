import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Criar conta" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const tipo = sp.tipo === "owner" || sp.tipo === "both" ? sp.tipo : "advertiser";

  return (
    <>
      <h1 className="text-3xl font-bold">Criar conta</h1>
      <p className="mt-2 text-muted-foreground">
        Gratuito. Você poderá habilitar o outro perfil depois.
      </p>
      <div className="mt-8 space-y-4">
        {!isSupabaseConfigured() && (
          <Alert variant="warning" title="Ambiente sem Supabase configurado">
            Defina as variáveis de ambiente do Supabase para habilitar o cadastro.
          </Alert>
        )}
        <SignUpForm defaultType={tipo} />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
