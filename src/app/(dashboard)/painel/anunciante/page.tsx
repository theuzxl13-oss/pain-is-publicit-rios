import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCheck,
  CreditCard,
  Heart,
  MessagesSquare,
  Receipt,
  Search,
} from "lucide-react";
import { FlashMessages } from "@/components/dashboard/flash-messages";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireArea } from "@/server/auth/session";
import { formatCents } from "@/server/domain/money";
import { getAdvertiserStats } from "@/server/services/dashboard-service";

export const metadata: Metadata = { title: "Painel do anunciante" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdvertiserDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireArea("advertiser", "/painel/anunciante");
  const [stats, sp] = await Promise.all([getAdvertiserStats(), searchParams]);
  const s = stats.data;

  return (
    <>
      <FlashMessages searchParams={sp} />
      <PageHeader
        title="Painel do anunciante"
        description="Suas buscas, negociações e reservas em um só lugar."
      >
        <Button asChild>
          <Link href="/explorar">
            <Search aria-hidden /> Explorar painéis
          </Link>
        </Button>
      </PageHeader>

      {!user.profile?.documentNumber && (
        <Alert variant="info" title="Complete seu cadastro">
          Informe CPF ou CNPJ em{" "}
          <Link href="/conta" className="font-medium text-primary hover:underline">
            Minha conta
          </Link>{" "}
          para poder contratar painéis.
        </Alert>
      )}

      {stats.error && <Alert variant="destructive" title={stats.error} />}
      {s && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Negociações em aberto"
            value={s.requests_open}
            icon={MessagesSquare}
            tone="accent"
          />
          <StatCard
            label="Aguardando pagamento"
            value={s.awaiting_payment}
            icon={CreditCard}
            tone="warning"
          />
          <StatCard
            label="Reservas ativas"
            value={s.bookings_active}
            icon={CalendarCheck}
            tone="success"
          />
          <StatCard label="Campanhas concluídas" value={s.bookings_completed} icon={CheckCheck} />
          <StatCard label="Favoritos" value={s.favorites} icon={Heart} />
          <StatCard
            label="Total investido"
            value={formatCents(s.total_paid_cents)}
            icon={Receipt}
          />
        </div>
      )}
    </>
  );
}
