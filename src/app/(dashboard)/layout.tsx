import Link from "next/link";
import { LogOut } from "lucide-react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Logo } from "@/components/layout/logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/server/domain/roles";
import { requireUser } from "@/server/auth/session";
import { signOutAction } from "../(auth)/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/painel");
  const name = user.profile?.fullName ?? user.email ?? "Usuário";

  return (
    <div className="min-h-dvh bg-secondary/40">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              href="/explorar"
              className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
            >
              Explorar painéis
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{name}</p>
              <p className="text-xs text-muted-foreground">
                {user.roles.map((r) => ROLE_LABELS[r]).join(" · ") || "Sem perfil"}
              </p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" aria-label="Sair da conta">
                <LogOut aria-hidden /> <span className="hidden sm:inline">Sair</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container grid gap-6 py-6 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <DashboardNav roles={user.roles} />
        </aside>
        <main id="conteudo" className="min-w-0 space-y-6">
          {!user.isActive && (
            <Alert variant="destructive" title="Conta suspensa">
              Seu acesso às funcionalidades está restrito. Entre em contato com o{" "}
              <Link href="/suporte" className="font-medium text-primary hover:underline">
                suporte
              </Link>
              .
            </Alert>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
