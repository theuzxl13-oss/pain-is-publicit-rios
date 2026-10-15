"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";

export function MobileNav({ authenticated }: { authenticated: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X /> : <Menu />}
      </Button>
      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 z-40 h-[calc(100dvh-4rem)] overflow-y-auto border-t bg-background p-4 animate-in fade-in slide-in-from-top-2"
        >
          <nav aria-label="Menu principal" className="flex flex-col gap-1">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-3 text-base font-medium hover:bg-secondary",
                  pathname === item.href && "bg-secondary text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 grid gap-2 border-t pt-6">
            {authenticated ? (
              <Button asChild size="lg">
                <Link href="/painel">Minha área</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg">
                  <Link href="/entrar">Entrar</Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/cadastro">Criar conta</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
