import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  Inbox,
  LayoutGrid,
  Megaphone,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { FlashMessages } from "@/components/dashboard/flash-messages";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { requireArea } from "@/server/auth/session";
import { formatCents } from "@/server/domain/money";
import { PANEL_STATUS_LABELS, type PanelStatus } from "@/server/domain/panel";
import { getOwnerStats, listMyPanels } from "@/server/services/dashboard-service";

export const metadata: Metadata = { title: "Painel do proprietário" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const STATUS_VARIANT: Record<
  PanelStatus,
  "default" | "success" | "warning" | "destructive" | "secondary"
> = {
  draft: "secondary",
  pending_review: "warning",
  changes_requested: "warning",
  published: "success",
  rejected: "destructive",
  suspended: "destructive",
  inactive: "secondary",
};

export default async function OwnerDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireArea("owner", "/painel/proprietario");
  const [stats, panels, sp] = await Promise.all([
    getOwnerStats(),
    listMyPanels(user.id),
    searchParams,
  ]);
  const s = stats.data;

  return (
    <>
      <FlashMessages searchParams={sp} />
      <PageHeader
        title="Painel do proprietário"
        description="Acompanhe seus anúncios, solicitações e recebimentos."
      />

      {stats.error && <Alert variant="destructive" title={stats.error} />}
      {s && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Painéis cadastrados" value={s.panels_total} icon={LayoutGrid} />
          <StatCard
            label="Painéis ativos"
            value={s.panels_published}
            icon={Megaphone}
            tone="success"
          />
          <StatCard label="Em análise" value={s.panels_in_review} icon={Clock} tone="warning" />
          <StatCard
            label="Solicitações pendentes"
            value={s.requests_pending}
            icon={Inbox}
            tone="accent"
          />
          <StatCard
            label="Reservas confirmadas"
            value={s.bookings_confirmed}
            icon={CalendarCheck}
          />
          <StatCard
            label="Receita recebida"
            value={formatCents(s.revenue_received_cents)}
            icon={Wallet}
            tone="success"
          />
          <StatCard
            label="Valores a receber"
            value={formatCents(s.revenue_receivable_cents)}
            icon={PiggyBank}
            hint="Líquido de comissão e taxas, antes de tributos"
          />
        </div>
      )}

      <section aria-labelledby="meus-paineis" className="rounded-xl border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b p-5">
          <h2 id="meus-paineis" className="text-lg font-semibold">
            Meus painéis
          </h2>
        </div>
        {panels.error ? (
          <div className="p-5">
            <Alert variant="destructive" title={panels.error} />
          </div>
        ) : panels.data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium">Você ainda não tem painéis cadastrados.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              O cadastro de painéis estará disponível em breve. Enquanto isso, fale com nosso{" "}
              <Link
                href="/suporte?assunto=comercial"
                className="font-medium text-primary hover:underline"
              >
                time comercial
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {panels.data.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link href={`/paineis/${p.slug}`} className="font-medium hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {p.city} – {p.state} · {formatCents(p.price_cents)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[p.status as PanelStatus]}>
                  {PANEL_STATUS_LABELS[p.status as PanelStatus]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
