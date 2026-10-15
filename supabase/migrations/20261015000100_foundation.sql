-- =============================================================================
-- Fundação: extensões, tipos enumerados e utilitários comuns.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Papéis de aplicação. "admin" nunca pode ser atribuído pelo próprio usuário.
create type public.app_role as enum ('advertiser', 'owner', 'admin');

create type public.account_status as enum ('active', 'suspended');

create type public.document_type as enum ('cpf', 'cnpj');

create type public.panel_status as enum (
  'draft',              -- rascunho do proprietário
  'pending_review',     -- enviado para aprovação administrativa
  'changes_requested',  -- administrador pediu correções
  'published',          -- visível no marketplace
  'rejected',           -- reprovado
  'suspended',          -- suspenso pelo administrador
  'inactive'            -- desativado pelo proprietário
);

create type public.billing_unit as enum ('day', 'week', 'fortnight', 'month');

create type public.lighting_type as enum ('none', 'frontlight', 'backlight', 'led', 'other');

create type public.rental_status as enum (
  'submitted',          -- Solicitação enviada
  'under_review',       -- Em análise
  'negotiating',        -- Em negociação
  'awaiting_payment',   -- Aguardando pagamento
  'confirmed',          -- Confirmada
  'in_progress',        -- Em andamento
  'completed',          -- Concluída
  'rejected',           -- Recusada
  'cancelled',          -- Cancelada
  'expired'             -- Expirada
);

create type public.proposal_kind as enum ('initial', 'counter', 'info_request', 'info_response');

create type public.proposal_status as enum ('pending', 'accepted', 'rejected', 'superseded');

create type public.booking_status as enum (
  'hold',         -- reserva temporária durante o pagamento (expira)
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'expired'
);

create type public.payment_status as enum (
  'pending', 'in_process', 'approved', 'rejected', 'cancelled', 'refunded', 'charged_back'
);

create type public.financial_status as enum (
  'pending',      -- pagamento ainda não confirmado
  'held',         -- pago, aguardando liberação ao proprietário
  'available',    -- liberado para repasse
  'paid_out',     -- repassado
  'refunded',
  'cancelled'
);

create type public.payout_status as enum ('pending', 'processing', 'paid', 'failed', 'cancelled');

create type public.refund_status as enum ('requested', 'processing', 'completed', 'failed');

create type public.commission_scope as enum ('global', 'category', 'owner');

create type public.ticket_status as enum ('open', 'in_progress', 'waiting_user', 'resolved', 'closed');

create type public.dsr_type as enum ('access', 'correction', 'deletion', 'portability', 'revocation');

create type public.dsr_status as enum ('received', 'in_progress', 'completed', 'rejected');

create type public.delivery_status as enum ('queued', 'sent', 'failed');

-- -----------------------------------------------------------------------------
-- Utilitário: mantém updated_at.
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Schema privado para funções internas não expostas pela API REST.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
