import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/site";
import { getSessionUser } from "@/server/auth/session";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Menu principal" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <Button asChild>
              <Link href="/painel">
                <LayoutDashboard /> Minha área
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/entrar">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}
        </div>
        <MobileNav authenticated={Boolean(user)} />
      </div>
    </header>
  );
}
