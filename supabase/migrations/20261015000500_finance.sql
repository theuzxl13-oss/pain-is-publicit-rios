-- =============================================================================
-- Financeiro: pagamentos, webhooks, comissões, lançamentos, reembolsos, repasses.
-- Nenhum dado de cartão é armazenado: o checkout é do intermediador.
-- Todas as escritas acontecem no servidor (service role / funções RPC).
-- =============================================================================

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  payer_id uuid not null references public.profiles (id) on delete restrict,
  provider text not null check (provider ~ '^[a-z0-9_]+$'),
  provider_checkout_id text,           -- ex.: preference_id do Mercado Pago
  provider_payment_id text,            -- id da transação no intermediador
  method text,                          -- pix | credit_card | ...
  amount_cents bigint not null check (amount_cents > 0),
  currency char(3) not null default 'BRL',
  status public.payment_status not null default 'pending',
  provider_status text,
  provider_status_detail text,
  gateway_fee_cents bigint check (gateway_fee_cents >= 0),
  idempotency_key text not null unique,
  paid_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index payments_provider_payment_key on public.payments (provider, provider_payment_id)
  where provider_payment_id is not null;
create index payments_booking_idx on public.payments (booking_id);
create index payments_payer_idx on public.payments (payer_id, created_at desc);
create index payments_status_idx on public.payments (status, created_at desc);

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Registro bruto de webhooks: garante idempotência (mesmo evento não é processado duas vezes).
create table public.payment_webhook_events (
  id bigint generated always as identity primary key,
  provider text not null,
  event_key text not null,
  signature_valid boolean not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  attempts int not null default 0,
  last_error text,
  unique (provider, event_key)
);

-- -----------------------------------------------------------------------------
-- Regras de comissão (com vigência). Prioridade: proprietário > categoria > global.
-- -----------------------------------------------------------------------------
create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  scope public.commission_scope not null,
  category_id uuid references public.categories (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  percent numeric(5, 2) not null default 0 check (percent between 0 and 100),
  fixed_cents bigint not null default 0 check (fixed_cents >= 0),
  -- Quem paga a comissão (decisão comercial pendente; ver docs/DECISOES.md)
  charged_to text not null default 'owner' check (charged_to in ('owner', 'advertiser')),
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  active boolean not null default true,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint commission_rules_scope_target check (
    (scope = 'global' and category_id is null and owner_id is null)
    or (scope = 'category' and category_id is not null and owner_id is null)
    or (scope = 'owner' and owner_id is not null and category_id is null)
  ),
  constraint commission_rules_validity check (valid_to is null or valid_to > valid_from)
);

create index commission_rules_lookup_idx on public.commission_rules (scope, active, valid_from);

-- Resolve a regra vigente para um painel numa data.
create or replace function public.resolve_commission_rule(_panel_id uuid, _at timestamptz default now())
returns public.commission_rules
language sql
stable
security definer
set search_path = ''
as $$
  select r.*
  from public.commission_rules r
  join public.panels p on p.id = _panel_id
  where r.active
    and r.valid_from <= _at
    and (r.valid_to is null or r.valid_to > _at)
    and (
      (r.scope = 'owner' and r.owner_id = p.owner_id)
      or (r.scope = 'category' and r.category_id = p.category_id)
      or r.scope = 'global'
    )
  order by case r.scope when 'owner' then 1 when 'category' then 2 else 3 end, r.valid_from desc
  limit 1;
$$;

revoke all on function public.resolve_commission_rule(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.resolve_commission_rule(uuid, timestamptz) to service_role;

-- -----------------------------------------------------------------------------
-- Lançamento financeiro por reserva (fotografia dos valores no momento)
-- -----------------------------------------------------------------------------
create table public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  gross_cents bigint not null check (gross_cents >= 0),
  commission_cents bigint not null default 0 check (commission_cents >= 0),
  gateway_fee_cents bigint not null default 0 check (gateway_fee_cents >= 0),
  net_owner_cents bigint not null,
  commission_rule_id uuid references public.commission_rules (id) on delete set null,
  commission_snapshot jsonb not null default '{}'::jsonb,
  status public.financial_status not null default 'pending',
  available_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index financial_entries_owner_idx on public.financial_entries (owner_id, status);

create trigger financial_entries_updated_at before update on public.financial_entries
  for each row execute function public.set_updated_at();

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  status public.refund_status not null default 'requested',
  reason text,
  provider_refund_id text,
  requested_by uuid references auth.users (id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index refunds_payment_idx on public.refunds (payment_id);

create trigger refunds_updated_at before update on public.refunds
  for each row execute function public.set_updated_at();

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  status public.payout_status not null default 'pending',
  method text,
  reference text,
  paid_at timestamptz,
  notes text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payouts_owner_idx on public.payouts (owner_id, created_at desc);

create trigger payouts_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

create table public.payout_items (
  payout_id uuid not null references public.payouts (id) on delete cascade,
  financial_entry_id uuid not null unique references public.financial_entries (id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  primary key (payout_id, financial_entry_id)
);
