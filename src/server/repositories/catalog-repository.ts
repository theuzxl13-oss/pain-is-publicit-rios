import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicEnv, isSupabaseConfigured } from "@/lib/env";
import { sanitizeSearchTerm } from "@/lib/search";
import type { Category, PanelCardData, PanelDetail } from "@/types/panel";

const PANEL_BASE_COLUMNS =
  "id, slug, title, city, state, neighborhood, width_m, height_m, price_cents, billing_unit, price_negotiable, availability_notes";
const PANEL_CARD_COLUMNS = `${PANEL_BASE_COLUMNS}, categories(name), panel_images(storage_path, position)`;
const PANEL_CARD_COLUMNS_BY_CATEGORY = `${PANEL_BASE_COLUMNS}, categories!inner(name, slug), panel_images(storage_path, position)`;
const PANEL_DETAIL_COLUMNS = `${PANEL_BASE_COLUMNS}, categories(name), panel_images(storage_path, position, alt_text), description, street, street_number, postal_code, latitude, longitude, lighting, orientation, visibility_notes, estimated_daily_impressions, features, min_periods, rental_rules, status`;

export function publicImageUrl(storagePath: string): string {
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/panel-images/${storagePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

type PanelRow = {
  id: string;
  slug: string;
  title: string;
  city: string;
  state: string;
  neighborhood: string;
  width_m: number | string;
  height_m: number | string;
  price_cents: number;
  billing_unit: PanelCardData["billingUnit"];
  price_negotiable: boolean;
  availability_notes: string | null;
  categories: { name: string } | null;
  panel_images: { storage_path: string; position: number }[] | null;
};

function toCard(row: PanelRow): PanelCardData {
  const cover = [...(row.panel_images ?? [])].sort((a, b) => a.position - b.position)[0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    city: row.city,
    state: row.state,
    neighborhood: row.neighborhood,
    categoryName: row.categories?.name ?? "Painel",
    widthM: Number(row.width_m),
    heightM: Number(row.height_m),
    priceCents: Number(row.price_cents),
    billingUnit: row.billing_unit,
    priceNegotiable: row.price_negotiable,
    availabilityNotes: row.availability_notes,
    coverUrl: cover ? publicImageUrl(cover.storage_path) : null,
  };
}

export type CatalogResult<T> = { data: T; error: string | null };

export async function listActiveCategories(): Promise<CatalogResult<Category[]>> {
  if (!isSupabaseConfigured()) return { data: [], error: "not_configured" };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("active", true)
    .order("sort_order");
  return { data: (data as Category[] | null) ?? [], error: error ? "query_failed" : null };
}

export type PanelListFilters = {
  q?: string;
  categorySlug?: string;
  state?: string;
  sort?: "recent" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export async function listPublishedPanels(
  filters: PanelListFilters = {},
): Promise<CatalogResult<{ items: PanelCardData[]; total: number }>> {
  if (!isSupabaseConfigured()) return { data: { items: [], total: 0 }, error: "not_configured" };
  const supabase = await createSupabaseServerClient();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 12, 1), 48);
  const page = Math.max(filters.page ?? 1, 1);

  let query = supabase
    .from("panels")
    .select(filters.categorySlug ? PANEL_CARD_COLUMNS_BY_CATEGORY : PANEL_CARD_COLUMNS, {
      count: "exact",
    })
    .eq("status", "published");

  const term = sanitizeSearchTerm(filters.q);
  if (term) {
    query = query.or(
      `city.ilike.%${term}%,neighborhood.ilike.%${term}%,street.ilike.%${term}%,title.ilike.%${term}%`,
    );
  }
  if (filters.categorySlug) query = query.eq("categories.slug", filters.categorySlug);
  if (filters.state && /^[A-Z]{2}$/.test(filters.state)) query = query.eq("state", filters.state);

  switch (filters.sort) {
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    default:
      query = query.order("first_published_at", { ascending: false, nullsFirst: false });
  }

  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) return { data: { items: [], total: 0 }, error: "query_failed" };
  return {
    data: { items: ((data ?? []) as unknown as PanelRow[]).map(toCard), total: count ?? 0 },
    error: null,
  };
}

export async function getPanelBySlug(slug: string): Promise<PanelDetail | null> {
  if (!isSupabaseConfigured() || !/^[a-z0-9-]{1,140}$/.test(slug)) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("panels")
    .select(PANEL_DETAIL_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;

  const row = data as unknown as PanelRow & {
    description: string;
    street: string;
    street_number: string | null;
    postal_code: string;
    latitude: number;
    longitude: number;
    lighting: PanelDetail["lighting"];
    orientation: string | null;
    visibility_notes: string | null;
    estimated_daily_impressions: number | null;
    features: string[];
    min_periods: number;
    rental_rules: string | null;
    status: PanelDetail["status"];
    panel_images: { storage_path: string; position: number; alt_text: string | null }[] | null;
  };

  const images = [...(row.panel_images ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ url: publicImageUrl(img.storage_path), alt: img.alt_text ?? row.title }));

  return {
    ...toCard(row),
    description: row.description,
    street: row.street,
    streetNumber: row.street_number,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    lighting: row.lighting,
    orientation: row.orientation,
    visibilityNotes: row.visibility_notes,
    estimatedDailyImpressions: row.estimated_daily_impressions,
    features: row.features ?? [],
    minPeriods: row.min_periods,
    rentalRules: row.rental_rules,
    status: row.status,
    images,
  };
}
