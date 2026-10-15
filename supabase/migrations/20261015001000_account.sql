-- =============================================================================
-- Conta: vínculo do usuário com empresa (criação/edição pelo próprio usuário).
-- =============================================================================

create or replace function public.set_my_company(_legal_name text, _trade_name text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company uuid;
  v_name text := btrim(coalesce(_legal_name, ''));
  v_trade text := nullif(btrim(coalesce(_trade_name, '')), '');
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.is_active_user() then
    raise exception 'account_inactive' using errcode = '42501';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 160 then
    raise exception 'invalid_legal_name' using errcode = '22023';
  end if;

  select company_id into v_company from public.profiles where id = auth.uid();

  if v_company is null then
    insert into public.companies (legal_name, trade_name, created_by)
    values (v_name, v_trade, auth.uid())
    returning id into v_company;
    update public.profiles set company_id = v_company where id = auth.uid();
  else
    update public.companies set legal_name = v_name, trade_name = v_trade where id = v_company;
  end if;

  return v_company;
end;
$$;

revoke all on function public.set_my_company(text, text) from public, anon, authenticated;
grant execute on function public.set_my_company(text, text) to authenticated;
