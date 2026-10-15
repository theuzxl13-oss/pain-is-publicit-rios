-- =============================================================================
-- Row Level Security. Regra geral: nada é acessível sem política explícita.
-- Escritas sensíveis (status, financeiro, reservas) só por funções/servidor.
-- =============================================================================

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.categories enable row level security;
alter table public.panels enable row level security;
alter table public.panel_images enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.favorites enable row level security;
alter table public.rental_requests enable row level security;
alter table public.rental_request_events enable row level security;
alter table public.proposals enable row level security;
alter table public.bookings enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_acceptances enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.commission_rules enable row level security;
alter table public.financial_entries enable row level security;
alter table public.refunds enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_items enable row level security;
alter table public.notifications enable row level security;
alter table public.email_deliveries enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.settings enable row level security;
alter table public.data_subject_requests enable row level security;

-- -----------------------------------------------------------------------------
-- Perfis: o usuário lê e edita apenas campos permitidos do próprio perfil.
-- -----------------------------------------------------------------------------
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and (select public.is_active_user()))
  with check (id = (select auth.uid()));

-- Privilégio por coluna: status, e-mail e datas de aceite não são editáveis pelo usuário.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone, document_type, document_number, avatar_path, marketing_opt_in)
  on public.profiles to authenticated;

-- Empresas: membros leem e editam a própria empresa.
create policy companies_select on public.companies
  for select to authenticated
  using (
    exists (select 1 from public.profiles p where p.company_id = companies.id and p.id = (select auth.uid()))
    or (select public.is_admin())
  );

create policy companies_update on public.companies
  for update to authenticated
  using (exists (select 1 from public.profiles p where p.company_id = companies.id and p.id = (select auth.uid())))
  with check (exists (select 1 from public.profiles p where p.company_id = companies.id and p.id = (select auth.uid())));

revoke insert, delete on public.companies from anon, authenticated;
revoke update on public.companies from anon, authenticated;
grant update (legal_name, trade_name, cnpj) on public.companies to authenticated;

-- Papéis: leitura própria; escrita só via enable_role/admin_set_role.
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.user_roles from anon, authenticated;

-- Auditoria: somente administradores leem; ninguém altera pela API.
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.audit_logs from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------
create policy categories_public_select on public.categories
  for select to anon, authenticated
  using (active or (select public.is_admin()));

create policy categories_admin_write on public.categories
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy panels_select on public.panels
  for select to anon, authenticated
  using (
    status = 'published'
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy panels_owner_insert on public.panels
  for insert to authenticated
  with check (owner_id = (select auth.uid()) and (select public.has_role('owner')));

create policy panels_owner_update on public.panels
  for update to authenticated
  using (owner_id = (select auth.uid()) and (select public.has_role('owner')))
  with check (owner_id = (select auth.uid()));

create policy panels_admin_update on public.panels
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Painéis não são apagados (histórico de locações); desativa-se via status.
revoke delete on public.panels from anon, authenticated;

create policy panel_images_select on public.panel_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.panels p
    where p.id = panel_images.panel_id
      and (p.status = 'published' or p.owner_id = (select auth.uid()) or (select public.is_admin()))
  ));

create policy panel_images_owner_write on public.panel_images
  for all to authenticated
  using (exists (
    select 1 from public.panels p
    where p.id = panel_images.panel_id and p.owner_id = (select auth.uid()) and p.status <> 'suspended'
  ))
  with check (exists (
    select 1 from public.panels p
    where p.id = panel_images.panel_id and p.owner_id = (select auth.uid()) and p.status <> 'suspended'
  ));

-- Bloqueios: o público consulta via panel_occupancy(); dono e admin gerenciam.
create policy availability_blocks_owner_all on public.availability_blocks
  for all to authenticated
  using (exists (select 1 from public.panels p where p.id = availability_blocks.panel_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.panels p where p.id = availability_blocks.panel_id and p.owner_id = (select auth.uid())));

create policy availability_blocks_admin_all on public.availability_blocks
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy favorites_own on public.favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Locações: as partes e administradores leem; escrita somente por RPC.
-- -----------------------------------------------------------------------------
create policy rental_requests_parties_select on public.rental_requests
  for select to authenticated
  using (
    advertiser_id = (select auth.uid())
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );
revoke insert, update, delete on public.rental_requests from anon, authenticated;

create policy rental_request_events_select on public.rental_request_events
  for select to authenticated
  using (exists (
    select 1 from public.rental_requests r
    where r.id = rental_request_events.request_id
      and (r.advertiser_id = (select auth.uid()) or r.owner_id = (select auth.uid()) or (select public.is_admin()))
  ));
revoke insert, update, delete on public.rental_request_events from anon, authenticated;

create policy proposals_parties_select on public.proposals
  for select to authenticated
  using (exists (
    select 1 from public.rental_requests r
    where r.id = proposals.request_id
      and (r.advertiser_id = (select auth.uid()) or r.owner_id = (select auth.uid()) or (select public.is_admin()))
  ));
revoke insert, update, delete on public.proposals from anon, authenticated;

create policy bookings_parties_select on public.bookings
  for select to authenticated
  using (
    advertiser_id = (select auth.uid())
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );
revoke insert, update, delete on public.bookings from anon, authenticated;

create policy contracts_parties_select on public.contracts
  for select to authenticated
  using (exists (
    select 1 from public.rental_requests r
    where r.id = contracts.request_id
      and (r.advertiser_id = (select auth.uid()) or r.owner_id = (select auth.uid()) or (select public.is_admin()))
  ));
revoke insert, update, delete on public.contracts from anon, authenticated;

create policy contract_acceptances_select on public.contract_acceptances
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1 from public.contracts c
      join public.rental_requests r on r.id = c.request_id
      where c.id = contract_acceptances.contract_id
        and (r.advertiser_id = (select auth.uid()) or r.owner_id = (select auth.uid()))
    )
  );
revoke insert, update, delete on public.contract_acceptances from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Financeiro: cada parte vê apenas o que lhe diz respeito.
-- -----------------------------------------------------------------------------
create policy payments_select on public.payments
  for select to authenticated
  using (
    payer_id = (select auth.uid())
    or (select public.is_admin())
  );
revoke insert, update, delete on public.payments from anon, authenticated;

-- Eventos de webhook: somente servidor (service role ignora RLS).
revoke all on public.payment_webhook_events from anon, authenticated;

create policy commission_rules_admin on public.commission_rules
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy financial_entries_select on public.financial_entries
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.financial_entries from anon, authenticated;

create policy refunds_select on public.refunds
  for select to authenticated
  using (
    (select public.is_admin())
    or exists (select 1 from public.payments p where p.id = refunds.payment_id and p.payer_id = (select auth.uid()))
  );
revoke insert, update, delete on public.refunds from anon, authenticated;

create policy payouts_select on public.payouts
  for select to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));
revoke insert, update, delete on public.payouts from anon, authenticated;

create policy payout_items_select on public.payout_items
  for select to authenticated
  using (exists (
    select 1 from public.payouts p
    where p.id = payout_items.payout_id
      and (p.owner_id = (select auth.uid()) or (select public.is_admin()))
  ));
revoke insert, update, delete on public.payout_items from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Notificações: o usuário lê e marca como lida; criação só pelo servidor.
-- -----------------------------------------------------------------------------
create policy notifications_own_select on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy notifications_own_update on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
revoke insert, delete, update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy email_deliveries_admin on public.email_deliveries
  for select to authenticated using ((select public.is_admin()));
revoke insert, update, delete on public.email_deliveries from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Suporte: criação via create_support_ticket(); o autor acompanha os seus.
-- -----------------------------------------------------------------------------
create policy support_tickets_select on public.support_tickets
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy support_tickets_admin_update on public.support_tickets
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
revoke insert, delete on public.support_tickets from anon, authenticated;

create policy support_ticket_messages_select on public.support_ticket_messages
  for select to authenticated
  using (exists (
    select 1 from public.support_tickets t
    where t.id = support_ticket_messages.ticket_id
      and (t.user_id = (select auth.uid()) or (select public.is_admin()))
  ));
create policy support_ticket_messages_insert on public.support_ticket_messages
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and (
          (t.user_id = (select auth.uid()) and not support_ticket_messages.is_staff)
          or (select public.is_admin())
        )
    )
  );
revoke update, delete on public.support_ticket_messages from anon, authenticated;

create or replace function public.create_support_ticket(
  _name text,
  _email text,
  _phone text,
  _topic text,
  _subject text,
  _message text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_key text := 'support:' || coalesce(auth.uid()::text, lower(btrim(_email)));
begin
  if not public.rate_limit_hit(v_key, 5, 3600) then
    raise exception 'rate_limited' using errcode = '54000';
  end if;

  insert into public.support_tickets (user_id, name, email, phone, topic, subject, message)
  values (
    auth.uid(),
    btrim(_name),
    lower(btrim(_email)),
    nullif(regexp_replace(coalesce(_phone, ''), '\D', '', 'g'), ''),
    _topic,
    btrim(_subject),
    btrim(_message)
  )
  returning code into v_code;

  return v_code;
end;
$$;

revoke all on function public.create_support_ticket(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_support_ticket(text, text, text, text, text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Configurações: chaves públicas legíveis por todos; escrita só administradores.
-- -----------------------------------------------------------------------------
create policy settings_public_select on public.settings
  for select to anon, authenticated
  using (key like 'public.%' or (select public.is_admin()));
create policy settings_admin_write on public.settings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- LGPD
-- -----------------------------------------------------------------------------
create policy dsr_select on public.data_subject_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy dsr_insert_own on public.data_subject_requests
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'received');
create policy dsr_admin_update on public.data_subject_requests
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
revoke delete on public.data_subject_requests from anon, authenticated;
revoke insert on public.data_subject_requests from anon, authenticated;
grant insert (user_id, email, type, details) on public.data_subject_requests to authenticated;
