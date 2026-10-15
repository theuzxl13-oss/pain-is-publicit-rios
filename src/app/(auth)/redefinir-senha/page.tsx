import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/server/auth/session";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  return (
    <>
      <h1 className="text-3xl font-bold">Redefinir senha</h1>
      {user ? (
        <>
          <p className="mt-2 text-muted-foreground">Escolha uma nova senha para {user.email}.</p>
          <div className="mt-8">
            <ResetPasswordForm />
          </div>
        </>
      ) : (
        <div className="mt-8 space-y-4">
          <Alert variant="warning" title="Link inválido ou expirado">
            Abra o link mais recente enviado para o seu e-mail ou solicite uma nova redefinição.
          </Alert>
          <Button asChild className="w-full">
            <Link href="/recuperar-senha">Solicitar novo link</Link>
          </Button>
        </div>
      )}
    </>
  );
}
