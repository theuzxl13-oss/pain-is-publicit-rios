import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OwnerStats = {
  panels_total: number;
  panels_published: number;
  panels_in_review: number;
  requests_pending: number;
  bookings_confirmed: number;
  revenue_received_cents: number;
  revenue_receivable_cents: number;
};

export type AdvertiserStats = {
  favorites: number;
  requests_open: number;
  awaiting_payment: number;
  bookings_active: number;
  bookings_completed: number;
  total_paid_cents: number;
};

export type AdminStats = {
  users_total: number;
  owners: number;
  advertisers: number;
  panels_total: number;
  panels_published: number;
  panels_pending_review: number;
  requests_total: number;
  bookings_total: number;
  volume_cents: number;
  commission_cents: number;
  payments_pending: number;
  tickets_open: number;
};

type Fn = "owner_dashboard_stats" | "advertiser_dashboard_stats" | "admin_dashboard_stats";

async function fetchStats<T>(fn: Fn): Promise<{ data: T | null; error: string | null }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(fn);
  if (error) {
    console.error(
      JSON.stringify({ level: "error", msg: "dashboard_stats_failed", fn, code: error.code }),
    );
    return { data: null, error: "Não foi possível carregar os indicadores." };
  }
  return { data: data as T, error: null };
}

export const getOwnerStats = () => fetchStats<OwnerStats>("owner_dashboard_stats");
export const getAdvertiserStats = () => fetchStats<AdvertiserStats>("advertiser_dashboard_stats");
export const getAdminStats = () => fetchStats<AdminStats>("admin_dashboard_stats");

export async function listMyPanels(ownerId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("panels")
    .select("id, slug, title, city, state, status, price_cents, billing_unit, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(20);
  return { data: data ?? [], error: error ? "Não foi possível carregar seus painéis." : null };
}
