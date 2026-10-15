-- =============================================================================
-- Locações: solicitações, propostas, reservas, contratos e aceites.
-- As mutações de solicitações/reservas serão feitas por funções RPC
-- (Fases 3 e 4); clientes não têm permissão de escrita direta nessas tabelas.
-- =============================================================================

create table public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  panel_id uuid not null references public.panels (id) on delete restrict,
  advertiser_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  start_date date not null,
  end_date date not null,
  campaign_name text check (char_length(campaign_name) <= 160),
  campaign_details text check (char_length(campaign_details) <= 3000),
  notes text check (char_length(notes) <= 3000),
  status public.rental_status not null default 'submitted',
  -- Valores acordados (preenchidos quando uma proposta é aceita)
  agreed_amount_cents bigint check (agreed_amount_cents > 0),
  -- Solicitações sem resposta expiram (não bloqueiam o calendário)
  expires_at timestamptz,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_requests_dates check (end_date >= start_date),
  constraint rental_requests_parties check (advertiser_id <> owner_id)
);

create index rental_requests_panel_idx on public.rental_requests (panel_id, status);
create index rental_requests_advertiser_idx on public.rental_requests (advertiser_id, created_at desc);
create index rental_requests_owner_idx on public.rental_requests (owner_id, created_at desc);
create index rental_requests_expiry_idx on public.rental_requests (expires_at)
  where status in ('submitted', 'under_review', 'negotiating', 'awaiting_payment');

create trigger rental_requests_updated_at before update on public.rental_requests
  for each row execute function public.set_updated_at();

-- Máquina de estados: única fonte de verdade para transições permitidas.
create or replace function public.rental_transition_allowed(
  _from public.rental_status,
  _to public.rental_status
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case _from
    when 'submitted' then _to in ('under_review', 'negotiating', 'awaiting_payment', 'rejected', 'cancelled', 'expired')
    when 'under_review' then _to in ('negotiating', 'awaiting_payment', 'rejected', 'cancelled', 'expired')
    when 'negotiating' then _to in ('awaiting_payment', 'rejected', 'cancelled', 'expired')
    when 'awaiting_payment' then _to in ('confirmed', 'negotiating', 'cancelled', 'expired')
    when 'confirmed' then _to in ('in_progress', 'completed', 'cancelled')
    when 'in_progress' then _to in ('completed', 'cancelled')
    else false
  end;
$$;

create table public.rental_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.rental_requests (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  from_status public.rental_status,
  to_status public.rental_status not null,
  note text,
  created_at timestamptz not null default now()
);

create index rental_request_events_request_idx on public.rental_request_events (request_id, created_at);

create or replace function private.rental_requests_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'submitted' then
      raise exception 'invalid_initial_status' using errcode = '23514';
    end if;
    return new;
  end if;

  if new.panel_id <> old.panel_id or new.advertiser_id <> old.advertiser_id
     or new.owner_id <> old.owner_id then
    raise exception 'immutable_fields' using errcode = '23514';
  end if;

  if new.status is distinct from old.status then
    if not public.rental_transition_allowed(old.status, new.status) then
      raise exception 'invalid_status_transition: % -> %', old.status, new.status
        using errcode = '23514';
    end if;
    new.status_changed_at := now();
  end if;

  return new;
end;
$$;

create trigger rental_requests_guard before insert or update on public.rental_requests
  for each row execute function private.rental_requests_guard();

create or replace function private.rental_requests_log_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.rental_request_events (request_id, actor_id, from_status, to_status)
    values (new.id, auth.uid(), case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;
  return null;
end;
$$;

create trigger rental_requests_log_status after insert or update on public.rental_requests
  for each row execute function private.rental_requests_log_status();

-- -----------------------------------------------------------------------------
-- Propostas e contrapropostas (histórico imutável)
-- -----------------------------------------------------------------------------
create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  kind public.proposal_kind not null,
  start_date date,
  end_date date,
  amount_cents bigint check (amount_cents > 0),
  conditions text check (char_length(conditions) <= 3000),
  message text check (char_length(message) <= 3000),
  status public.proposal_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint proposals_dates check (end_date is null or start_date is null or end_date >= start_date),
  constraint proposals_offer_complete check (
    kind in ('info_request', 'info_response')
    or (start_date is not null and end_date is not null and amount_cents is not null)
  )
);

create index proposals_request_idx on public.proposals (request_id, created_at);
-- No máximo uma oferta pendente por solicitação.
create unique index proposals_one_pending_offer on public.proposals (request_id)
  where status = 'pending' and kind in ('initial', 'counter');

-- -----------------------------------------------------------------------------
-- Reservas. "period" é [início, fim+1) para permitir a verificação de conflito.
-- -----------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests (id) on delete restrict,
  panel_id uuid not null references public.panels (id) on delete restrict,
  advertiser_id uuid not null references public.profiles (id) on delete restrict,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  period daterange not null check (not isempty(period) and lower_inc(period) and not upper_inc(period)),
  amount_cents bigint not null check (amount_cents > 0),
  status public.booking_status not null default 'hold',
  hold_expires_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_hold_has_expiry check (status <> 'hold' or hold_expires_at is not null),
  -- REGRA FUNDAMENTAL: nenhum painel pode ter duas reservas ativas sobrepostas.
  -- Garantido pelo PostgreSQL mesmo sob concorrência.
  constraint bookings_no_overlap exclude using gist (panel_id with =, period with &&)
    where (status in ('hold', 'confirmed', 'in_progress'))
);

create unique index bookings_one_active_per_request on public.bookings (request_id)
  where status in ('hold', 'confirmed', 'in_progress');
create index bookings_panel_idx on public.bookings (panel_id, status);
create index bookings_advertiser_idx on public.bookings (advertiser_id);
create index bookings_owner_idx on public.bookings (owner_id);
create index bookings_hold_expiry_idx on public.bookings (hold_expires_at) where status = 'hold';

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- Antes de ocupar um período: serializa por painel (lock na linha do painel),
-- expira reservas temporárias vencidas e verifica bloqueios manuais.
create or replace function private.bookings_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('hold', 'confirmed', 'in_progress') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('hold', 'confirmed', 'in_progress')
     and new.period = old.period and new.panel_id = old.panel_id
     and not (old.status = 'hold' and old.hold_expires_at <= now() and new.status = 'confirmed') then
    return new;
  end if;

  perform 1 from public.panels where id = new.panel_id for update;

  if new.status = 'hold' and new.hold_expires_at <= now() then
    raise exception 'hold_already_expired' using errcode = '23514';
  end if;
  if tg_op = 'UPDATE' and old.status = 'hold' and old.hold_expires_at <= now()
     and new.status = 'confirmed' then
    raise exception 'hold_expired' using errcode = '23514';
  end if;

  update public.bookings
  set status = 'expired'
  where panel_id = new.panel_id
    and status = 'hold'
    and hold_expires_at <= now()
    and id <> new.id;

  if exists (
    select 1 from public.availability_blocks b
    where b.panel_id = new.panel_id and b.period && new.period
  ) then
    raise exception 'period_blocked' using errcode = '23P01';
  end if;

  return new;
end;
$$;

create trigger bookings_guard before insert or update on public.bookings
  for each row execute function private.bookings_guard();

-- Bloqueio manual não pode sobrepor reserva ativa (holds vencidos não contam).
create or replace function private.availability_blocks_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.panels where id = new.panel_id for update;

  if exists (
    select 1 from public.bookings k
    where k.panel_id = new.panel_id
      and k.period && new.period
      and (
        k.status in ('confirmed', 'in_progress')
        or (k.status = 'hold' and k.hold_expires_at > now())
      )
  ) then
    raise exception 'period_booked' using errcode = '23P01';
  end if;

  new.created_by := coalesce(new.created_by, auth.uid());
  return new;
end;
$$;

create trigger availability_blocks_guard before insert or update on public.availability_blocks
  for each row execute function private.availability_blocks_guard();

-- Rotina periódica: expira reservas temporárias e solicitações vencidas.
create or replace function public.expire_stale_records()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  n_holds int;
  n_requests int;
begin
  with expired as (
    update public.bookings set status = 'expired'
    where status = 'hold' and hold_expires_at <= now()
    returning request_id
  )
  select count(*) into n_holds from expired;

  update public.rental_requests set status = 'expired'
  where status in ('submitted', 'under_review', 'negotiating', 'awaiting_payment')
    and expires_at is not null and expires_at <= now()
    and not exists (
      select 1 from public.bookings k
      where k.request_id = rental_requests.id
        and k.status in ('confirmed', 'in_progress')
    );
  get diagnostics n_requests = row_count;

  return jsonb_build_object('holds', n_holds, 'requests', n_requests);
end;
$$;

revoke all on function public.expire_stale_records() from public, anon, authenticated;
grant execute on function public.expire_stale_records() to service_role;

-- Disponibilidade pública de um painel (sem expor quem reservou nem valores).
create or replace function public.panel_occupancy(
  _panel_id uuid,
  _from date,
  _to date
)
returns table (start_date date, end_date date, kind text)
language sql
stable
security definer
set search_path = ''
as $$
  select lower(b.period), upper(b.period) - 1, 'blocked'
  from public.availability_blocks b
  join public.panels p on p.id = b.panel_id
  where b.panel_id = _panel_id
    and (p.status = 'published' or p.owner_id = auth.uid() or public.is_admin())
    and b.period && daterange(_from, _to + 1)
  union all
  select lower(k.period), upper(k.period) - 1, 'booked'
  from public.bookings k
  join public.panels p on p.id = k.panel_id
  where k.panel_id = _panel_id
    and (p.status = 'published' or p.owner_id = auth.uid() or public.is_admin())
    and k.period && daterange(_from, _to + 1)
    and (
      k.status in ('confirmed', 'in_progress')
      or (k.status = 'hold' and k.hold_expires_at > now())
    )
  order by 1;
$$;

grant execute on function public.panel_occupancy(uuid, date, date) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Contratos e aceites
-- -----------------------------------------------------------------------------
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.rental_requests (id) on delete restrict,
  booking_id uuid references public.bookings (id) on delete restrict,
  terms_version text not null,
  terms_text text not null,
  summary jsonb not null,
  content_sha256 text not null,
  created_at timestamptz not null default now()
);

create index contracts_request_idx on public.contracts (request_id);

create table public.contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  content_sha256 text not null,
  accepted_at timestamptz not null default now(),
  ip inet,
  user_agent text,
  unique (contract_id, user_id)
);
