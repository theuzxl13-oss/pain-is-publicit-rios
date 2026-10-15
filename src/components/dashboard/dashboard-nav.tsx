"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Megaphone, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/server/domain/roles";

const ICONS = {
  advertiser: Megaphone,
  owner: Building2,
  admin: ShieldCheck,
  account: UserRound,
  overview: LayoutDashboard,
};

export function DashboardNav({ roles }: { roles: AppRole[] }) {
  const pathname = usePathname();
  const items = [
    roles.includes("advertiser") && {
      href: "/painel/anunciante",
      label: "Anunciante",
      icon: ICONS.advertiser,
    },
    roles.includes("owner") && {
      href: "/painel/proprietario",
      label: "Proprietário",
      icon: ICONS.owner,
    },
    roles.includes("admin") && { href: "/admin", label: "Administração", icon: ICONS.admin },
    { href: "/conta", label: "Minha conta", icon: ICONS.account },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Megaphone }[];

  return (
    <nav aria-label="Área logada" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon aria-hidden className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
