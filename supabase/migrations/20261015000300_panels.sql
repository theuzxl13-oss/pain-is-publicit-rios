-- =============================================================================
-- Catálogo: categorias, painéis, imagens, bloqueios manuais e favoritos.
-- =============================================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 60),
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

insert into public.categories (slug, name, description, sort_order) values
  ('outdoor', 'Outdoor', 'Painéis de grande formato, geralmente 9 x 3 m, com lona ou papel.', 10),
  ('painel-led', 'Painel de LED', 'Telas digitais com exibição rotativa de anúncios.', 20),
  ('frontlight', 'Frontlight', 'Painel com iluminação frontal por refletores.', 30),
  ('backlight', 'Backlight', 'Painel com iluminação interna, por trás da lona.', 40),
  ('empena', 'Empena', 'Fachadas laterais de edifícios.', 50),
  ('totem', 'Totem publicitário', 'Estruturas verticais em calçadas, praças e centros comerciais.', 60),
  ('rodoviario', 'Painel rodoviário', 'Painéis às margens de rodovias.', 70),
  ('outros', 'Outros', 'Demais formatos de mídia exterior.', 999);

-- -----------------------------------------------------------------------------
-- Painéis
-- -----------------------------------------------------------------------------
create table public.panels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 5000),

  -- Endereço
  street text not null check (char_length(street) between 2 and 160),
  street_number text check (char_length(street_number) <= 20),
  complement text check (char_length(complement) <= 120),
  neighborhood text not null check (char_length(neighborhood) between 2 and 120),
  city text not null check (char_length(city) between 2 and 120),
  state char(2) not null check (state ~ '^[A-Z]{2}$'),
  postal_code text not null check (postal_code ~ '^\d{8}$'),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),

  -- Características
  width_m numeric(6, 2) not null check (width_m > 0),
  height_m numeric(6, 2) not null check (height_m > 0),
  lighting public.lighting_type not null default 'none',
  orientation text check (char_length(orientation) <= 160),
  visibility_notes text check (char_length(visibility_notes) <= 1000),
  estimated_daily_impressions int check (estimated_daily_impressions >= 0),
  features text[] not null default '{}',

  -- Comercial (valores sempre em centavos de real)
  price_cents bigint not null check (price_cents > 0),
  billing_unit public.billing_unit not null default 'month',
  min_periods int not null default 1 check (min_periods between 1 and 365),
  price_negotiable boolean not null default false,
  rental_rules text check (char_length(rental_rules) <= 3000),
  availability_notes text check (char_length(availability_notes) <= 1000),

  -- Moderação
  status public.panel_status not null default 'draft',
  review_notes text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  first_published_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index panels_owner_idx on public.panels (owner_id);
create index panels_status_idx on public.panels (status);
create index panels_category_idx on public.panels (category_id) where status = 'published';
create index panels_geo_idx on public.panels (latitude, longitude) where status = 'published';
create index panels_city_idx on public.panels (state, city) where status = 'published';
create index panels_price_idx on public.panels (price_cents) where status = 'published';
create index panels_title_trgm_idx on public.panels using gin (title extensions.gin_trgm_ops);

create trigger panels_updated_at before update on public.panels
  for each row execute function public.set_updated_at();

-- Regras de transição de status e de campos protegidos.
-- Administradores podem tudo (e são auditados). Proprietários:
--   draft | changes_requested | rejected -> pending_review  (enviar para análise)
--   pending_review -> draft                                 (retirar da análise)
--   published -> inactive                                   (desativar anúncio)
--   inactive -> published   (somente se já foi aprovado antes)
create or replace function private.panels_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_admin boolean := public.is_admin();
  is_service boolean := coalesce(auth.role(), '') = 'service_role' or auth.uid() is null;
begin
  if is_service then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not is_admin then
      if new.status not in ('draft', 'pending_review') then
        raise exception 'invalid_initial_status' using errcode = '42501';
      end if;
      new.review_notes := null;
      new.reviewed_by := null;
      new.reviewed_at := null;
      new.first_published_at := null;
    end if;
    return new;
  end if;

  -- UPDATE
  if new.owner_id <> old.owner_id and not is_admin then
    raise exception 'owner_change_forbidden' using errcode = '42501';
  end if;

  if is_admin then
    if new.status is distinct from old.status then
      if new.status = 'published' and old.first_published_at is null then
        new.first_published_at := now();
      end if;
      if new.status in ('published', 'rejected', 'changes_requested', 'suspended') then
        new.reviewed_by := auth.uid();
        new.reviewed_at := now();
      end if;
      perform private.audit('panel.status_changed', 'panel', new.id::text,
        jsonb_build_object('from', old.status, 'to', new.status, 'notes', new.review_notes));
    end if;
    return new;
  end if;

  if old.status = 'suspended' then
    raise exception 'panel_suspended' using errcode = '42501';
  end if;

  -- Proprietário não altera campos de moderação.
  new.review_notes := old.review_notes;
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;
  new.first_published_at := old.first_published_at;

  if new.status is distinct from old.status then
    if not (
      (old.status in ('draft', 'changes_requested', 'rejected') and new.status = 'pending_review')
      or (old.status = 'pending_review' and new.status = 'draft')
      or (old.status = 'published' and new.status = 'inactive')
      or (old.status = 'inactive' and new.status = 'published' and old.first_published_at is not null)
    ) then
      raise exception 'invalid_status_transition: % -> %', old.status, new.status
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger panels_guard before insert or update on public.panels
  for each row execute function private.panels_guard();

-- -----------------------------------------------------------------------------
-- Imagens (arquivos no bucket "panel-images", caminho "<panel_id>/<arquivo>")
-- -----------------------------------------------------------------------------
create table public.panel_images (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.panels (id) on delete cascade,
  storage_path text not null unique,
  alt_text text check (char_length(alt_text) <= 200),
  position int not null default 0 check (position >= 0),
  width int,
  height int,
  created_at timestamptz not null default now(),
  constraint panel_images_path_matches_panel check (split_part(storage_path, '/', 1) = panel_id::text)
);

create index panel_images_panel_idx on public.panel_images (panel_id, position);

-- -----------------------------------------------------------------------------
-- Bloqueios manuais de disponibilidade (intervalo de datas fechado [início, fim]).
-- Conflitos com reservas são verificados por gatilho na migration de locações.
-- -----------------------------------------------------------------------------
create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  panel_id uuid not null references public.panels (id) on delete cascade,
  period daterange not null check (not isempty(period) and lower_inc(period) and not upper_inc(period)),
  reason text check (char_length(reason) <= 300),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint availability_blocks_no_overlap exclude using gist (panel_id with =, period with &&)
);

-- -----------------------------------------------------------------------------
-- Favoritos
-- -----------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  panel_id uuid not null references public.panels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, panel_id)
);

create index favorites_panel_idx on public.favorites (panel_id);

-- -----------------------------------------------------------------------------
-- Distância geodésica aproximada (fórmula de Haversine), em km.
-- Suficiente para ordenação por proximidade; ver docs/PLANO.md sobre PostGIS.
-- -----------------------------------------------------------------------------
create or replace function public.haversine_km(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
)
returns double precision
language sql
immutable
parallel safe
set search_path = ''
as $$
  select 2 * 6371 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;
