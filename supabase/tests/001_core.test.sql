-- Testes de regras de negócio e segurança aplicadas pelo banco.
-- Executado por scripts/test-db.sh como superusuário; alterna papéis com SET ROLE.

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.expect_error(_sql text, _pattern text)
returns void language plpgsql as $$
begin
  begin
    execute _sql;
  exception when others then
    if sqlerrm !~* _pattern then
      raise exception 'Erro inesperado para [%]: % (esperado ~ %)', _sql, sqlerrm, _pattern;
    end if;
    return;
  end;
  raise exception 'Esperava erro ~ % em: %', _pattern, _sql;
end;
$$;

create function tests.assert(_cond boolean, _msg text)
returns void language plpgsql as $$
begin
  if _cond is not true then
    raise exception 'FALHOU: %', _msg;
  end if;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Cadastro: criação de perfil e saneamento de metadados
-- -----------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@teste.com', '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-0000000000a1', 'anunciante@teste.com',
    '{"full_name":"Ana Anunciante","account_type":"admin","document_number":"529.982.247-25","phone":"(11) 98888-7777"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'dono@teste.com',
    '{"full_name":"Bruno Dono","account_type":"owner","document_number":"111.111.111-11","company_name":"Bruno Mídia LTDA"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'ambos@teste.com',
    '{"full_name":"Carla","account_type":"both","document_number":"11.222.333/0001-81"}');

-- Bootstrap do primeiro administrador (feito manualmente pelo responsável técnico)
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'admin');

select tests.assert(
  (select array_agg(role order by role)::text from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a1') = '{advertiser}',
  'account_type=admin no cadastro não pode conceder admin');
select tests.assert(
  (select array_agg(role order by role)::text from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000b1') = '{owner}',
  'account_type=owner concede apenas owner');
select tests.assert(
  (select array_agg(role order by role)::text from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000c1') = '{advertiser,owner}',
  'account_type=both concede os dois papéis');
select tests.assert(
  (select document_type = 'cpf' and document_number = '52998224725' and phone = '11988887777'
   from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'CPF válido e telefone são normalizados');
select tests.assert(
  (select document_number is null from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'),
  'CPF inválido é descartado');
select tests.assert(
  (select c.legal_name = 'Bruno Mídia LTDA' from public.profiles p join public.companies c on c.id = p.company_id
   where p.id = '00000000-0000-0000-0000-0000000000b1'),
  'empresa criada a partir do cadastro');
select tests.assert(
  (select document_type = 'cnpj' from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'),
  'CNPJ válido aceito');

-- -----------------------------------------------------------------------------
-- Perfis e papéis sob RLS
-- -----------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);

select tests.assert((select count(*) from public.profiles) = 1, 'usuário só enxerga o próprio perfil');
select tests.expect_error($$update public.profiles set status = 'active' where id = auth.uid()$$, 'permission denied');
select tests.expect_error($$insert into public.user_roles (user_id, role) values (auth.uid(), 'admin')$$, 'permission denied');
select tests.expect_error($$select public.enable_role('admin')$$, 'role_not_allowed');
select tests.expect_error($$select public.admin_set_role(auth.uid(), 'admin', true)$$, 'forbidden');
update public.profiles set full_name = 'Ana A. Anunciante' where id = auth.uid();
update public.profiles set full_name = 'Hacker' where id = '00000000-0000-0000-0000-0000000000b1';
select public.enable_role('owner');
select tests.assert(public.has_role('owner'), 'enable_role(owner) habilita proprietário');
reset role;

select tests.assert(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = 'Bruno Dono',
  'usuário não altera perfil de terceiros');
select tests.assert(
  exists (select 1 from public.audit_logs where action = 'role.self_enabled'),
  'habilitação de papel é auditada');
delete from public.user_roles where user_id = '00000000-0000-0000-0000-0000000000a1' and role = 'owner';

-- -----------------------------------------------------------------------------
-- Painéis: moderação e visibilidade
-- -----------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select tests.expect_error($$
  insert into public.panels (owner_id, category_id, slug, title, street, neighborhood, city, state, postal_code,
    latitude, longitude, width_m, height_m, price_cents)
  values (auth.uid(), (select id from public.categories where slug = 'outdoor'), 'p-anunciante', 'Painel X',
    'Rua A', 'Centro', 'São Paulo', 'SP', '01001000', -23.55, -46.63, 9, 3, 100000)$$, 'row-level security');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
insert into public.panels (id, owner_id, category_id, slug, title, street, neighborhood, city, state, postal_code,
  latitude, longitude, width_m, height_m, price_cents, status, review_notes)
values ('10000000-0000-0000-0000-000000000001', auth.uid(), (select id from public.categories where slug = 'outdoor'),
  'outdoor-paulista', 'Outdoor Av. Paulista', 'Av. Paulista', 'Bela Vista', 'São Paulo', 'SP', '01310100',
  -23.5614, -46.6559, 9, 3, 250000, 'draft', 'tentativa de forjar revisão');
select tests.assert(
  (select review_notes is null from public.panels where id = '10000000-0000-0000-0000-000000000001'),
  'proprietário não grava campos de moderação');
select tests.expect_error($$update public.panels set status = 'published' where id = '10000000-0000-0000-0000-000000000001'$$,
  'invalid_status_transition');
update public.panels set status = 'pending_review' where id = '10000000-0000-0000-0000-000000000001';
select tests.expect_error($$delete from public.panels where id = '10000000-0000-0000-0000-000000000001'$$, 'permission denied');

set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert((select count(*) from public.panels) = 0, 'anônimo não vê painel não publicado');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
update public.panels set status = 'published', review_notes = 'ok' where id = '10000000-0000-0000-0000-000000000001';

set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert((select count(*) from public.panels) = 1, 'anônimo vê painel publicado');
select tests.assert((select count(*) from public.profiles) = 0, 'anônimo não lê perfis');
reset role;

select tests.assert(
  (select first_published_at is not null and reviewed_by = '00000000-0000-0000-0000-00000000000a'
   from public.panels where id = '10000000-0000-0000-0000-000000000001'),
  'aprovação registra revisor e data de publicação');
select tests.assert(exists (select 1 from public.audit_logs where action = 'panel.status_changed'),
  'mudança de status por admin é auditada');

-- -----------------------------------------------------------------------------
-- Solicitações: transições de status e acesso
-- -----------------------------------------------------------------------------
insert into public.rental_requests (id, panel_id, advertiser_id, owner_id, start_date, end_date)
values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '2027-01-01', '2027-01-31');
insert into public.rental_requests (id, panel_id, advertiser_id, owner_id, start_date, end_date)
values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '2027-01-15', '2027-02-15');

update public.rental_requests set status = 'under_review' where id = '20000000-0000-0000-0000-000000000001';
update public.rental_requests set status = 'awaiting_payment' where id = '20000000-0000-0000-0000-000000000001';
select tests.expect_error($$update public.rental_requests set status = 'completed' where id = '20000000-0000-0000-0000-000000000001'$$,
  'invalid_status_transition');
select tests.assert(
  (select count(*) from public.rental_request_events where request_id = '20000000-0000-0000-0000-000000000001') = 3,
  'histórico de status registrado');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select tests.assert((select count(*) from public.rental_requests) = 1, 'anunciante vê apenas as próprias solicitações');
select tests.expect_error($$update public.rental_requests set status = 'confirmed'$$, 'permission denied');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
select tests.assert((select count(*) from public.rental_requests) = 2, 'proprietário vê solicitações dos seus painéis');
reset role;

-- -----------------------------------------------------------------------------
-- Reservas: conflito de períodos garantido pelo banco
-- -----------------------------------------------------------------------------
insert into public.bookings (id, request_id, panel_id, advertiser_id, owner_id, period, amount_cents, status, hold_expires_at)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '[2027-01-01,2027-02-01)', 250000,
  'hold', now() + interval '30 minutes');

-- Segunda reserva sobreposta (outro anunciante) é recusada.
select tests.expect_error($$
  insert into public.bookings (request_id, panel_id, advertiser_id, owner_id, period, amount_cents, status, hold_expires_at)
  values ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '[2027-01-15,2027-02-16)', 250000,
    'hold', now() + interval '30 minutes')$$, 'bookings_no_overlap');

-- Bloqueio manual sobre reserva ativa é recusado.
select tests.expect_error($$
  insert into public.availability_blocks (panel_id, period) values ('10000000-0000-0000-0000-000000000001', '[2027-01-20,2027-01-25)')$$,
  'period_booked');

-- Hold vencido não bloqueia: expira e libera o período.
update public.bookings set hold_expires_at = now() - interval '1 minute' where id = '30000000-0000-0000-0000-000000000001';
select tests.expect_error($$update public.bookings set status = 'confirmed' where id = '30000000-0000-0000-0000-000000000001'$$,
  'hold_expired');
insert into public.bookings (id, request_id, panel_id, advertiser_id, owner_id, period, amount_cents, status, hold_expires_at)
values ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '[2027-01-15,2027-02-16)', 250000,
  'hold', now() + interval '30 minutes');
select tests.assert(
  (select status = 'expired' from public.bookings where id = '30000000-0000-0000-0000-000000000001'),
  'hold vencido marcado como expirado ao reservar o período');
update public.bookings set status = 'confirmed', confirmed_at = now() where id = '30000000-0000-0000-0000-000000000002';

-- Períodos adjacentes são permitidos; bloqueio manual sobre reserva confirmada não.
insert into public.availability_blocks (panel_id, period) values ('10000000-0000-0000-0000-000000000001', '[2027-02-16,2027-03-01)');
select tests.expect_error($$
  insert into public.availability_blocks (panel_id, period) values ('10000000-0000-0000-0000-000000000001', '[2027-02-10,2027-02-12)')$$,
  'period_booked');
-- Reserva sobre bloqueio manual é recusada.
insert into public.rental_requests (id, panel_id, advertiser_id, owner_id, start_date, end_date)
values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '2027-02-20', '2027-02-25');
select tests.expect_error($$
  insert into public.bookings (request_id, panel_id, advertiser_id, owner_id, period, amount_cents, status, hold_expires_at)
  values ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b1', '[2027-02-20,2027-02-26)', 50000,
    'hold', now() + interval '30 minutes')$$, 'period_blocked');

-- Ocupação pública não expõe partes nem valores.
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.assert(
  (select count(*) from public.panel_occupancy('10000000-0000-0000-0000-000000000001', '2027-01-01', '2027-12-31')) = 2,
  'ocupação pública lista reserva confirmada e bloqueio');
select tests.assert((select count(*) from public.bookings) = 0, 'anônimo não lê reservas');
reset role;

-- -----------------------------------------------------------------------------
-- Comissões: precedência proprietário > categoria > global, com vigência
-- -----------------------------------------------------------------------------
insert into public.commission_rules (scope, percent) values ('global', 10);
insert into public.commission_rules (scope, category_id, percent)
  values ('category', (select id from public.categories where slug = 'outdoor'), 8);
insert into public.commission_rules (scope, owner_id, percent, valid_from)
  values ('owner', '00000000-0000-0000-0000-0000000000b1', 5, now() + interval '10 days');
select tests.assert(
  (select percent from public.resolve_commission_rule('10000000-0000-0000-0000-000000000001')) = 8,
  'regra de categoria vence a global');
select tests.assert(
  (select percent from public.resolve_commission_rule('10000000-0000-0000-0000-000000000001', now() + interval '11 days')) = 5,
  'regra por proprietário vigente vence as demais');

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
select tests.assert((select count(*) from public.commission_rules) = 0, 'não-admin não lê regras de comissão');
select tests.expect_error($$select public.resolve_commission_rule('10000000-0000-0000-0000-000000000001')$$, 'permission denied');
reset role;

-- -----------------------------------------------------------------------------
-- Suporte: criação anônima com rate limit
-- -----------------------------------------------------------------------------
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select public.create_support_ticket('Visitante', 'visitante@teste.com', null, 'duvida', 'Pergunta', 'Gostaria de saber mais.')
from generate_series(1, 5);
select tests.expect_error($$select public.create_support_ticket('Visitante', 'VISITANTE@teste.com', null, 'duvida', 'Pergunta', 'Gostaria de saber mais.')$$,
  'rate_limited');
select tests.assert((select count(*) from public.support_tickets) = 0, 'anônimo não lê chamados');
reset role;

-- -----------------------------------------------------------------------------
-- Configurações: só chaves públicas para visitantes
-- -----------------------------------------------------------------------------
set role anon;
select tests.assert((select bool_and(key like 'public.%') from public.settings), 'visitante lê apenas configurações públicas');
reset role;

-- -----------------------------------------------------------------------------
-- Conta suspensa perde privilégios
-- -----------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select public.admin_set_account_status('00000000-0000-0000-0000-0000000000b1', 'suspended', 'teste');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', false);
select tests.assert(not public.has_role('owner'), 'conta suspensa não exerce papel de proprietário');
select tests.expect_error($$select public.enable_role('advertiser')$$, 'account_inactive');
reset role;

\echo '  ok: 001_core'
