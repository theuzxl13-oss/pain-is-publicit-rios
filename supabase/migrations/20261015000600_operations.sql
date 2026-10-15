-- =============================================================================
-- Operação: notificações, e-mails, suporte, configurações, LGPD, rate limiting.
-- =============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text check (link is null or link ~ '^/'),
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notifications (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  to_email text not null,
  template text not null,
  subject text not null,
  status public.delivery_status not null default 'queued',
  provider text,
  provider_message_id text,
  attempts int not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index email_deliveries_status_idx on public.email_deliveries (status, created_at);

create trigger email_deliveries_updated_at before update on public.email_deliveries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Suporte
-- -----------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  user_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(name) between 2 and 120),
  email extensions.citext not null check (char_length(email::text) <= 254),
  phone text check (phone is null or phone ~ '^\d{10,13}$'),
  topic text not null check (topic in ('duvida', 'comercial', 'financeiro', 'tecnico', 'denuncia', 'privacidade', 'outro')),
  subject text not null check (char_length(subject) between 3 and 160),
  message text not null check (char_length(message) between 10 and 5000),
  status public.ticket_status not null default 'open',
  assigned_to uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index support_tickets_status_idx on public.support_tickets (status, created_at desc);

create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  is_staff boolean not null default false,
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);

-- -----------------------------------------------------------------------------
-- Configurações gerais (chave/valor). Chaves "public.*" são legíveis por todos.
-- -----------------------------------------------------------------------------
create table public.settings (
  key text primary key check (key ~ '^[a-z0-9_.]+$'),
  value jsonb not null,
  description text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create or replace function private.settings_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if auth.uid() is not null then
    perform private.audit('settings.changed', 'setting', new.key,
      jsonb_build_object('old', case when tg_op = 'UPDATE' then old.value end, 'new', new.value));
  end if;
  return new;
end;
$$;

create trigger settings_audit before insert or update on public.settings
  for each row execute function private.settings_audit();

insert into public.settings (key, value, description) values
  ('public.platform_name', '"Plataforma de Locação de Painéis Publicitários"', 'Nome exibido na interface'),
  ('public.support_email', '"suporte@seudominio.com.br"', 'E-mail de suporte exibido no site'),
  ('public.support_phone', 'null', 'Telefone comercial exibido no site'),
  ('booking.hold_minutes', '30', 'Validade da reserva temporária durante o pagamento (minutos) — PROVISÓRIO'),
  ('rental.request_ttl_hours', '72', 'Prazo para o proprietário responder uma solicitação (horas) — PROVISÓRIO'),
  ('rental.payment_ttl_hours', '48', 'Prazo para pagamento após aprovação (horas) — PROVISÓRIO'),
  ('finance.payout_release_days', '2', 'Dias após o início da veiculação para liberar repasse — PROVISÓRIO'),
  ('panels.require_admin_approval', 'true', 'Novos painéis passam por aprovação administrativa — PROVISÓRIO');

-- -----------------------------------------------------------------------------
-- LGPD: solicitações de titulares
-- -----------------------------------------------------------------------------
create table public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  email extensions.citext not null,
  type public.dsr_type not null,
  details text check (char_length(details) <= 3000),
  status public.dsr_status not null default 'received',
  response text,
  handled_by uuid references auth.users (id) on delete set null,
  due_at timestamptz not null default now() + interval '15 days',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index data_subject_requests_status_idx on public.data_subject_requests (status, due_at);

create trigger data_subject_requests_updated_at before update on public.data_subject_requests
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Rate limiting compartilhado entre instâncias serverless (janela fixa).
-- -----------------------------------------------------------------------------
create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

create or replace function public.rate_limit_hit(_key text, _max int, _window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / _window_seconds) * _window_seconds);
  n int;
begin
  insert into private.rate_limits as r (key, window_start, hits)
  values (left(_key, 200), w, 1)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into n;

  -- Limpeza oportunista de janelas antigas.
  if random() < 0.01 then
    delete from private.rate_limits where window_start < now() - interval '1 day';
  end if;

  return n <= _max;
end;
$$;

revoke all on function public.rate_limit_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, int, int) to service_role;
