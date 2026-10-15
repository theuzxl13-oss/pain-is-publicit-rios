-- Indicadores: cada função só responde ao papel correspondente.
-- Depende dos dados criados em 001_core.test.sql.

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select tests.assert((public.advertiser_dashboard_stats() ->> 'requests_open')::int = 1, 'anunciante: solicitações abertas');
select tests.expect_error($$select public.owner_dashboard_stats()$$, 'forbidden');
select tests.expect_error($$select public.admin_dashboard_stats()$$, 'forbidden');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
select tests.assert((public.owner_dashboard_stats() ->> 'panels_total')::int = 0, 'proprietário sem painéis');
select tests.assert((public.advertiser_dashboard_stats() ->> 'bookings_active')::int = 1, 'anunciante com reserva confirmada');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
select tests.assert((public.admin_dashboard_stats() ->> 'users_total')::int = 4, 'admin: total de usuários');
select tests.assert((public.admin_dashboard_stats() ->> 'panels_published')::int = 1, 'admin: painéis publicados');
reset role;

\echo '  ok: 002_dashboards'

-- Empresa do próprio usuário
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select public.set_my_company('Ana Comunicação LTDA', 'Ana Com');
select public.set_my_company('Ana Comunicação S.A.', null);
select tests.assert((select count(*) from public.companies) = 1, 'usuário vê somente a própria empresa');
select tests.assert((select legal_name from public.companies) = 'Ana Comunicação S.A.', 'empresa atualizada');
select tests.expect_error($$select public.set_my_company('x')$$, 'invalid_legal_name');
reset role;

\echo '  ok: 002_account'
