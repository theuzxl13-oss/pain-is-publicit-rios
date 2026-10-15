-- =============================================================================
-- Identidade: perfis, empresas, papéis, auditoria.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Validação de documentos (CPF/CNPJ) — dígitos verificadores.
-- -----------------------------------------------------------------------------
create or replace function private.is_valid_cpf(doc text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  s int;
  d1 int;
  d2 int;
  i int;
begin
  if doc is null or doc !~ '^\d{11}$' or doc ~ '^(\d)\1{10}$' then
    return false;
  end if;
  s := 0;
  for i in 1..9 loop
    s := s + substr(doc, i, 1)::int * (11 - i);
  end loop;
  d1 := (s * 10) % 11;
  if d1 = 10 then d1 := 0; end if;
  if d1 <> substr(doc, 10, 1)::int then
    return false;
  end if;
  s := 0;
  for i in 1..10 loop
    s := s + substr(doc, i, 1)::int * (12 - i);
  end loop;
  d2 := (s * 10) % 11;
  if d2 = 10 then d2 := 0; end if;
  return d2 = substr(doc, 11, 1)::int;
end;
$$;

create or replace function private.is_valid_cnpj(doc text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  w1 int[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  w2 int[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  s int;
  r int;
  i int;
begin
  if doc is null or doc !~ '^\d{14}$' or doc ~ '^(\d)\1{13}$' then
    return false;
  end if;
  s := 0;
  for i in 1..12 loop
    s := s + substr(doc, i, 1)::int * w1[i];
  end loop;
  r := s % 11;
  if (case when r < 2 then 0 else 11 - r end) <> substr(doc, 13, 1)::int then
    return false;
  end if;
  s := 0;
  for i in 1..13 loop
    s := s + substr(doc, i, 1)::int * w2[i];
  end loop;
  r := s % 11;
  return (case when r < 2 then 0 else 11 - r end) = substr(doc, 14, 1)::int;
end;
$$;

grant execute on function private.is_valid_cpf(text) to authenticated, service_role;
grant execute on function private.is_valid_cnpj(text) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Empresas
-- -----------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(legal_name) between 2 and 160),
  trade_name text check (trade_name is null or char_length(trade_name) between 2 and 160),
  cnpj text check (cnpj is null or private.is_valid_cnpj(cnpj)),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companies_cnpj_key on public.companies (cnpj) where cnpj is not null;

create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email extensions.citext,
  phone text check (phone is null or phone ~ '^\d{10,13}$'),
  document_type public.document_type,
  document_number text,
  company_id uuid references public.companies (id) on delete set null,
  avatar_path text,
  status public.account_status not null default 'active',
  status_reason text,
  marketing_opt_in boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_document_valid check (
    (document_type is null and document_number is null)
    or (document_type = 'cpf' and private.is_valid_cpf(document_number))
    or (document_type = 'cnpj' and private.is_valid_cnpj(document_number))
  )
);

create index profiles_company_idx on public.profiles (company_id);
create index profiles_email_idx on public.profiles (email);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Papéis
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- -----------------------------------------------------------------------------
-- Auditoria (somente inserção via funções; leitura por administradores)
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function private.audit(
  _action text,
  _entity_type text,
  _entity_id text,
  _metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), _action, _entity_type, _entity_id, coalesce(_metadata, '{}'::jsonb));
$$;

revoke all on function private.audit(text, text, text, jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Funções de autorização usadas pelas políticas RLS.
-- SECURITY DEFINER evita recursão de RLS ao consultar user_roles/profiles.
-- -----------------------------------------------------------------------------
create or replace function public.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join public.profiles p on p.id = r.user_id
    where r.user_id = auth.uid()
      and r.role = _role
      and p.status = 'active'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_role('admin');
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.status = 'active'
  );
$$;

revoke all on function public.has_role(public.app_role) from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.is_active_user() from public, anon, authenticated;
grant execute on function public.has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_active_user() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Criação automática de perfil no cadastro (auth.users).
-- Os metadados vêm do cliente e NÃO são confiáveis: tudo é saneado aqui.
-- Papel "admin" nunca é aceito.
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text;
  v_phone text;
  v_doc text;
  v_doc_type public.document_type;
  v_company_name text;
  v_company_id uuid;
  v_account_type text;
begin
  v_name := nullif(btrim(left(coalesce(meta ->> 'full_name', ''), 120)), '');
  if v_name is null or char_length(v_name) < 2 then
    v_name := left(split_part(coalesce(new.email, 'usuario'), '@', 1), 120);
    if char_length(v_name) < 2 then
      v_name := 'Usuário';
    end if;
  end if;

  v_phone := regexp_replace(coalesce(meta ->> 'phone', ''), '\D', '', 'g');
  if v_phone !~ '^\d{10,13}$' then
    v_phone := null;
  end if;

  v_doc := regexp_replace(coalesce(meta ->> 'document_number', ''), '\D', '', 'g');
  if char_length(v_doc) = 11 and private.is_valid_cpf(v_doc) then
    v_doc_type := 'cpf';
  elsif char_length(v_doc) = 14 and private.is_valid_cnpj(v_doc) then
    v_doc_type := 'cnpj';
  else
    v_doc := null;
    v_doc_type := null;
  end if;

  v_company_name := nullif(btrim(left(coalesce(meta ->> 'company_name', ''), 160)), '');
  if v_company_name is not null and char_length(v_company_name) >= 2 then
    insert into public.companies (legal_name, cnpj, created_by)
    values (
      v_company_name,
      case
        when v_doc_type = 'cnpj'
          and not exists (select 1 from public.companies c where c.cnpj = v_doc)
        then v_doc
      end,
      new.id
    )
    returning id into v_company_id;
  end if;

  insert into public.profiles (
    id, full_name, email, phone, document_type, document_number, company_id,
    terms_accepted_at, privacy_accepted_at
  )
  values (
    new.id, v_name, new.email, v_phone, v_doc_type, v_doc, v_company_id,
    case when (meta ->> 'accepted_terms') = 'true' then now() end,
    case when (meta ->> 'accepted_terms') = 'true' then now() end
  );

  v_account_type := coalesce(meta ->> 'account_type', 'advertiser');
  if v_account_type not in ('advertiser', 'owner', 'both') then
    v_account_type := 'advertiser';
  end if;

  -- 'advertiser' e 'both' recebem o papel de anunciante.
  if v_account_type <> 'owner' then
    insert into public.user_roles (user_id, role) values (new.id, 'advertiser')
    on conflict do nothing;
  end if;
  if v_account_type in ('owner', 'both') then
    insert into public.user_roles (user_id, role) values (new.id, 'owner')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- O usuário pode habilitar para si os papéis de anunciante ou proprietário.
-- -----------------------------------------------------------------------------
create or replace function public.enable_role(_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if _role not in ('advertiser', 'owner') then
    raise exception 'role_not_allowed' using errcode = '42501';
  end if;
  if not public.is_active_user() then
    raise exception 'account_inactive' using errcode = '42501';
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (auth.uid(), _role, auth.uid())
  on conflict do nothing;

  if found then
    perform private.audit('role.self_enabled', 'user', auth.uid()::text,
      jsonb_build_object('role', _role));
  end if;
end;
$$;

revoke all on function public.enable_role(public.app_role) from public, anon, authenticated;
grant execute on function public.enable_role(public.app_role) to authenticated;

-- -----------------------------------------------------------------------------
-- Funções administrativas (auditadas)
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_role(
  _user_id uuid,
  _role public.app_role,
  _grant boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _user_id = auth.uid() and _role = 'admin' and not _grant then
    raise exception 'cannot_remove_own_admin' using errcode = '42501';
  end if;

  if _grant then
    insert into public.user_roles (user_id, role, granted_by)
    values (_user_id, _role, auth.uid())
    on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user_id and role = _role;
  end if;

  perform private.audit(
    case when _grant then 'role.granted' else 'role.revoked' end,
    'user', _user_id::text, jsonb_build_object('role', _role));
end;
$$;

create or replace function public.admin_set_account_status(
  _user_id uuid,
  _status public.account_status,
  _reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if _user_id = auth.uid() then
    raise exception 'cannot_change_own_status' using errcode = '42501';
  end if;

  update public.profiles
  set status = _status, status_reason = left(_reason, 500)
  where id = _user_id;

  perform private.audit('account.status_changed', 'user', _user_id::text,
    jsonb_build_object('status', _status, 'reason', _reason));
end;
$$;

revoke all on function public.admin_set_role(uuid, public.app_role, boolean) from public, anon, authenticated;
revoke all on function public.admin_set_account_status(uuid, public.account_status, text) from public, anon, authenticated;
grant execute on function public.admin_set_role(uuid, public.app_role, boolean) to authenticated;
grant execute on function public.admin_set_account_status(uuid, public.account_status, text) to authenticated;
