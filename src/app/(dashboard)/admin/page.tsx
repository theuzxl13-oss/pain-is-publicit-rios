import type { Metadata } from "next";
import {
  Banknote,
  Building2,
  CalendarCheck,
  ClipboardList,
  Clock,
  CreditCard,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  Percent,
  Users,
} from "lucide-react";
import { FlashMessages } from "@/components/dashboard/flash-messages";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { requireArea } from "@/server/auth/session";
import { formatCents } from "@/server/domain/money";
import { getAdminStats } from "@/server/services/dashboard-service";

export const metadata: Metadata = { title: "Administração" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  await requireArea("admin", "/admin");
  const [stats, sp] = await Promise.all([getAdminStats(), searchParams]);
  const s = stats.data;

  return (
    <>
      <FlashMessages searchParams={sp} />
      <PageHeader title="Administração" description="Visão geral da operação da plataforma." />
      {stats.error && <Alert variant="destructive" title={stats.error} />}
      {s && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Usuários" value={s.users_total} icon={Users} />
          <StatCard label="Proprietários" value={s.owners} icon={Building2} />
          <StatCard label="Anunciantes" value={s.advertisers} icon={Megaphone} />
          <StatCard
            label="Chamados abertos"
            value={s.tickets_open}
            icon={LifeBuoy}
            tone="warning"
          />
          <StatCard label="Painéis cadastrados" value={s.panels_total} icon={LayoutGrid} />
          <StatCard
            label="Painéis publicados"
            value={s.panels_published}
            icon={Megaphone}
            tone="success"
          />
          <StatCard
            label="Aguardando aprovação"
            value={s.panels_pending_review}
            icon={Clock}
            tone="warning"
          />
          <StatCard label="Solicitações" value={s.requests_total} icon={ClipboardList} />
          <StatCard label="Reservas" value={s.bookings_total} icon={CalendarCheck} />
          <StatCard
            label="Volume transacionado"
            value={formatCents(s.volume_cents)}
            icon={Banknote}
            tone="success"
          />
          <StatCard label="Comissões" value={formatCents(s.commission_cents)} icon={Percent} />
          <StatCard
            label="Pagamentos pendentes"
            value={s.payments_pending}
            icon={CreditCard}
            tone="accent"
          />
        </div>
      )}
    </>
  );
}
