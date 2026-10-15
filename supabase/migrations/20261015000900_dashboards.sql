-- =============================================================================
-- Indicadores dos dashboards (agregações no banco; respeitam o papel do chamador).
-- =============================================================================

create or replace function public.owner_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if not public.has_role('owner') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'panels_total', (select count(*) from public.panels where owner_id = uid),
    'panels_published', (select count(*) from public.panels where owner_id = uid and status = 'published'),
    'panels_in_review', (select count(*) from public.panels where owner_id = uid and status = 'pending_review'),
    'requests_pending', (select count(*) from public.rental_requests
                          where owner_id = uid and status in ('submitted', 'under_review', 'negotiating')),
    'bookings_confirmed', (select count(*) from public.bookings
                            where owner_id = uid and status in ('confirmed', 'in_progress')),
    'revenue_received_cents', (select coalesce(sum(net_owner_cents), 0) from public.financial_entries
                                where owner_id = uid and status = 'paid_out'),
    'revenue_receivable_cents', (select coalesce(sum(net_owner_cents), 0) from public.financial_entries
                                  where owner_id = uid and status in ('held', 'available'))
  );
end;
$$;

create or replace function public.advertiser_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if not public.has_role('advertiser') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'favorites', (select count(*) from public.favorites where user_id = uid),
    'requests_open', (select count(*) from public.rental_requests
                       where advertiser_id = uid and status in ('submitted', 'under_review', 'negotiating')),
    'awaiting_payment', (select count(*) from public.rental_requests
                          where advertiser_id = uid and status = 'awaiting_payment'),
    'bookings_active', (select count(*) from public.bookings
                         where advertiser_id = uid and status in ('confirmed', 'in_progress')),
    'bookings_completed', (select count(*) from public.bookings
                            where advertiser_id = uid and status = 'completed'),
    'total_paid_cents', (select coalesce(sum(amount_cents), 0) from public.payments
                          where payer_id = uid and status = 'approved')
  );
end;
$$;

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users_total', (select count(*) from public.profiles),
    'owners', (select count(*) from public.user_roles where role = 'owner'),
    'advertisers', (select count(*) from public.user_roles where role = 'advertiser'),
    'panels_total', (select count(*) from public.panels),
    'panels_published', (select count(*) from public.panels where status = 'published'),
    'panels_pending_review', (select count(*) from public.panels where status = 'pending_review'),
    'requests_total', (select count(*) from public.rental_requests),
    'bookings_total', (select count(*) from public.bookings where status in ('confirmed', 'in_progress', 'completed')),
    'volume_cents', (select coalesce(sum(amount_cents), 0) from public.payments where status = 'approved'),
    'commission_cents', (select coalesce(sum(commission_cents), 0) from public.financial_entries
                          where status not in ('refunded', 'cancelled', 'pending')),
    'payments_pending', (select count(*) from public.payments where status in ('pending', 'in_process')),
    'tickets_open', (select count(*) from public.support_tickets where status in ('open', 'in_progress'))
  );
end;
$$;

revoke all on function public.owner_dashboard_stats() from public, anon, authenticated;
revoke all on function public.advertiser_dashboard_stats() from public, anon, authenticated;
revoke all on function public.admin_dashboard_stats() from public, anon, authenticated;
grant execute on function public.owner_dashboard_stats() to authenticated;
grant execute on function public.advertiser_dashboard_stats() to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
