import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Recuperar senha</h1>
      <p className="mt-2 text-muted-foreground">
        Informe seu e-mail para receber um link de redefinição.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link href="/entrar" className="font-semibold text-primary hover:underline">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
