# Plano técnico — Plataforma de Locação de Painéis Publicitários

> Documento vivo. Regras marcadas como **PROVISÓRIO** dependem de decisão comercial (ver [DECISOES.md](./DECISOES.md)).

## 1. Análise dos requisitos

Marketplace de dois lados (proprietários × anunciantes) com intermediação completa: catálogo geolocalizado,
negociação com histórico, contratação com aceite registrado, pagamento por intermediador, reserva com garantia de
não-conflito e repasse com comissão. Os pontos de maior risco técnico são:

| Ponto crítico | Como é tratado |
|---|---|
| Duas reservas no mesmo período | Constraint `EXCLUDE USING gist` no PostgreSQL + lock por painel (testado) |
| Pagamento “aprovado” falso | Só webhook com assinatura válida + consulta à API do intermediador confirma; retorno do checkout é apenas informativo |
| Webhook duplicado | Tabela `payment_webhook_events` com `unique (provider, event_key)` |
| Escalada de privilégio | Papéis em `user_roles`, escrita só via funções `SECURITY DEFINER`; `admin` nunca auto-atribuível (testado) |
| Vazamento de dados entre usuários | RLS em todas as tabelas + privilégios por coluna (testado) |
| Calendário travado por pedidos parados | Solicitações não bloqueiam; só *holds* com expiração, confirmadas e em andamento |

## 2. MVP (Fases 1–6)

- Cadastro/login/recuperação, perfis anunciante e proprietário (mesma conta pode ter os dois), admin.
- Cadastro de painéis com fotos, endereço geocodificado, preço por unidade (dia/semana/bissemana/mês), prazo mínimo.
- Aprovação administrativa de painéis.
- Busca com filtros + mapa (Leaflet/OSM) com marcadores agrupados e busca na área visível.
- Página do painel com galeria, mapa, calendário de ocupação e estimativa de valor.
- Solicitação → análise → proposta/contraproposta → aceite → hold → pagamento (Pix/cartão via Checkout Pro) → confirmação por webhook.
- Dashboards do anunciante, proprietário e admin; comissões configuráveis; lançamentos financeiros; repasse **manual** registrado.
- Notificações in-app e e-mail (Resend); suporte com chamados; LGPD (solicitações de titulares).

## 3. Versões futuras

Split automático de pagamentos (após validar conta marketplace no Mercado Pago), assinatura eletrônica com
validade jurídica (ex.: Clicksign/D4Sign), emissão de NFS-e, parcelamento, avaliações/reputação, chat em tempo
real, comprovação de propriedade com upload de documentos, planos de destaque pagos, app mobile, PostGIS,
relatórios de audiência integrados, multi-idioma.

## 4. Arquitetura

```
Navegador ──► Next.js (Vercel)
               ├─ Server Components / Server Actions  ─► Supabase (Postgres + RLS, Auth, Storage)
               ├─ Route Handlers /api/webhooks/*       ─► service role (somente servidor)
               └─ Middleware (renova sessão, protege rotas)
Integrações (interfaces trocáveis em src/server/integrations/*):
   PaymentProvider  → Mercado Pago (Fase 4)
   Geocoder         → Nominatim | Mapbox (Fase 2)
   EmailSender      → Resend (Fase 5)
```

Camadas no código:

| Camada | Pasta | Regra |
|---|---|---|
| UI | `src/app`, `src/components` | Sem regra de negócio; só chama actions/serviços |
| Actions | `src/app/**/actions.ts` | Finas: delegam para serviços |
| Serviços | `src/server/services` | Validação (Zod), autorização, orquestração |
| Repositórios | `src/server/repositories` | Acesso a dados (Supabase) |
| Domínio | `src/server/domain` | Funções puras testáveis (preço, comissão, status, papéis) |
| Banco | `supabase/migrations` | **Última linha de defesa**: RLS, constraints, triggers, RPC |

Princípio: toda regra crítica existe **no banco** (não pode ser contornada chamando a API do Supabase
diretamente com a chave pública) e é espelhada no TypeScript para UX.

## 5. Modelagem de dados

Migrations em `supabase/migrations` (aplicadas em ordem):

| Migration | Entidades |
|---|---|
| `…0100_foundation` | extensões (btree_gist, citext, pg_trgm), enums, schema `private` |
| `…0200_identity` | `profiles`, `companies`, `user_roles`, `audit_logs`, validação CPF/CNPJ, gatilho de cadastro, `enable_role`, `admin_set_role`, `admin_set_account_status` |
| `…0300_panels` | `categories` (8 iniciais), `panels`, `panel_images`, `availability_blocks`, `favorites`, `haversine_km`, gatilho de moderação |
| `…0400_rentals` | `rental_requests` (+ máquina de estados), `rental_request_events`, `proposals`, `bookings` (exclusion constraint), `contracts`, `contract_acceptances`, `expire_stale_records`, `panel_occupancy` |
| `…0500_finance` | `payments`, `payment_webhook_events`, `commission_rules` (+ `resolve_commission_rule`), `financial_entries`, `refunds`, `payouts`, `payout_items` |
| `…0600_operations` | `notifications`, `email_deliveries`, `support_tickets`, `support_ticket_messages`, `settings`, `data_subject_requests`, rate limit |
| `…0700_rls` | Políticas RLS e privilégios por coluna para todas as tabelas |
| `…0800_storage` | Buckets `panel-images`, `avatars`, `private-docs` e políticas |
| `…0900_dashboards` | Indicadores agregados por papel |
| `…1000_account` | `set_my_company` |

Relacionamentos principais: `profiles 1–N panels`, `panels N–1 categories`, `panels 1–N rental_requests 1–N proposals`,
`rental_requests 1–N bookings` (no máximo 1 ativa), `bookings 1–N payments`, `bookings 1–1 financial_entries`,
`payouts N–N financial_entries` (via `payout_items`).

Valores monetários: sempre `bigint` em **centavos**. Períodos: `daterange` semiaberto `[início, fim+1)`.

**Geolocalização:** latitude/longitude em `double precision` com índice B-tree e consulta por *bounding box*
(área visível do mapa) + ordenação por Haversine. Para o volume previsto é suficiente e funciona em qualquer
Postgres. Migração para PostGIS (`geography(Point)` + GiST) é direta se o catálogo passar de dezenas de milhares
de painéis.

## 6. Fluxo completo da locação

```
Anunciante: solicita (painel, datas, campanha)            → submitted        [expira em 72h PROVISÓRIO]
Proprietário: abre                                        → under_review
   ├─ recusa                                              → rejected
   ├─ contraproposta / pede informação                    → negotiating (proposals registradas)
   └─ aprova                                              → awaiting_payment
Anunciante: aceita termos (hash do contrato, IP, UA)
Sistema: cria booking 'hold' (expira em 30 min PROVISÓRIO) — falha se conflito
Sistema: cria cobrança no Mercado Pago (idempotency_key)
Webhook assinado + consulta à API confirma 'approved'
   → booking 'confirmed', request 'confirmed', financial_entry 'held', notificações
Data de início → in_progress ; data fim → completed ; repasse liberado após N dias (PROVISÓRIO)
Hold vencido sem pagamento → booking 'expired' (período liberado automaticamente)
```

## 7. Regras de negócio implementadas no banco (Fase 1)

1. Um painel não pode ter duas reservas ativas (`hold` válido, `confirmed`, `in_progress`) sobrepostas — `EXCLUDE`.
2. Holds vencidos são expirados automaticamente antes de qualquer nova ocupação do painel.
3. Bloqueio manual não pode sobrepor reserva ativa e vice-versa (lock na linha do painel serializa a checagem).
4. Confirmar um hold já vencido é proibido.
5. Transições de status de solicitação seguem `rental_transition_allowed`; histórico em `rental_request_events`.
6. Proprietário não publica o próprio painel: `draft → pending_review`; só admin publica/reprova/suspende (auditado).
7. Cadastro nunca concede `admin`; metadados do cadastro são saneados; CPF/CNPJ inválidos são descartados.
8. Usuário não altera `status` do próprio perfil (privilégio por coluna); conta suspensa perde todos os papéis efetivos.
9. Comissão: prioridade proprietário > categoria > global, respeitando vigência.
10. Chamados de suporte: rate limit por e-mail/usuário no banco e por IP no servidor.

## 8. Estrutura de pastas

```
src/
  app/
    (site)/        páginas públicas (home, explorar, painel, institucionais, suporte)
    (auth)/        entrar, cadastro, recuperar/redefinir senha + actions
    (dashboard)/   painel/anunciante, painel/proprietario, admin, conta
    auth/confirm/  confirmação de e-mail e links de recuperação
    api/           health (e webhooks na Fase 4)
  components/      ui (shadcn-style), layout, marketing, panels, dashboard, auth
  config/          site, estados
  lib/             env, supabase (server/client/admin/middleware), validation, utils
  server/
    auth/          sessão, guards, mensagens de erro
    domain/        regras puras (papéis, rotas, preço, comissão, status, dinheiro)
    repositories/  consultas
    services/      casos de uso
    security/      rate limit
  types/
supabase/migrations, supabase/tests
tests/unit (Vitest), tests/e2e (Playwright)
scripts/test-db.sh
```

## 9. Cronograma (1 desenvolvedor, estimativa)

| Fase | Escopo | Duração |
|---|---|---|
| 1 Fundação | projeto, banco completo, auth, layout, dashboards base | **concluída** |
| 2 Marketplace | CRUD de painéis + upload, geocodificação, mapa, filtros avançados, página completa, aprovação admin | 2–3 semanas |
| 3 Negociação | solicitações, propostas, calendário, notificações in-app, dashboards completos | 2 semanas |
| 4 Contratação | contrato/aceite, hold, Mercado Pago (Pix/cartão), webhook, comprovantes, cancelamento/reembolso | 2–3 semanas |
| 5 Administração | gestão de usuários/painéis/categorias/financeiro, comissões, repasses, e-mails, relatórios CSV, chamados | 2 semanas |
| 6 Qualidade | testes de integração com Supabase local, pentest básico, homologação, deploy | 1–2 semanas |

Total estimado: 9–12 semanas até produção, dependendo das decisões comerciais e das contas dos provedores.

## 10. Riscos técnicos

| Risco | Mitigação |
|---|---|
| Split do Mercado Pago exige conta/aprovação específica | Repasse manual registrado no MVP; split como evolução |
| Política de uso dos tiles OSM (não permite uso intenso) | Volume baixo é aceitável; trocar por MapTiler/Stadia (plano gratuito) via `NEXT_PUBLIC_MAP_TILE_URL` |
| Nominatim: 1 req/s, sem uso em massa | Geocodificar só no cadastro do painel, com cache; Mapbox como alternativa |
| Validade jurídica do aceite eletrônico simples | Registrar hash, IP, data e UA; integrar assinatura eletrônica se exigido |
| Rate limit em serverless | Implementado no banco (compartilhado); fallback em memória só sem service role |
| Tipos do banco escritos à mão | Gerar com `supabase gen types` quando o projeto Supabase existir (pendente) |
| Plano gratuito do Supabase pausa e não tem backup | Usar plano Pro em produção |

## 11. Dependências externas

| Serviço | Uso | Configuração necessária |
|---|---|---|
| Supabase | Banco, Auth, Storage | Projeto, chaves, templates de e-mail, SMTP próprio (recomendado) |
| Vercel | Hospedagem | Projeto, variáveis, domínio, Cron (expiração de holds) |
| Mercado Pago | Pagamentos | Conta vendedor, credenciais, URL de webhook + secret |
| Resend | E-mail | Domínio verificado (SPF/DKIM) |
| OSM/Nominatim ou Mapbox | Mapas/geocodificação | User-Agent identificável ou token |
| Sentry (opcional) | Erros | DSN |
| UptimeRobot/Better Stack (opcional) | Disponibilidade | Monitorar `/api/health` |

## 12. Estimativa de custos (mensal, out/2026 — **verificar preços vigentes**; câmbio ~R$ 5,50/US$)

| Item | Plano | US$ | R$ aprox. |
|---|---|---|---|
| Vercel | Pro (o plano Hobby proíbe uso comercial) | 20 | 110 |
| Supabase | Pro (backups diários, sem pausa, 8 GB banco, 100 GB storage) | 25 | 140 |
| Resend | Free (3.000 e-mails/mês, 100/dia) | 0 | 0 |
| Mapas | OSM / MapTiler free | 0 | 0 |
| Sentry / Uptime | Planos gratuitos | 0 | 0 |
| **Total** | | **~45** | **~R$ 250** |

Dentro da faixa de R$ 200–350. Fora deste valor: domínio (~R$ 40/ano .com.br), taxas do Mercado Pago por
transação (Pix e cartão têm percentuais distintos conforme prazo de recebimento — consultar tabela da conta),
tributos, e eventual upgrade de compute do Supabase.

**Dependem do plano:** backups automáticos e PITR (Supabase Pro / add-on), logs retidos por mais tempo,
Cron Jobs com maior frequência (Vercel), SMTP próprio para e-mails de autenticação (o SMTP padrão do Supabase
tem limite baixo de envios por hora e não deve ser usado em produção).

## 13. Segurança, backups e monitoramento

- Segredos só em variáveis de ambiente; `SUPABASE_SERVICE_ROLE_KEY` nunca no cliente (`server-only`).
- Headers: HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (CSP completa na Fase 6).
- Redirects internos validados (`safeRedirectPath`) contra open redirect.
- Busca saneada contra injeção de filtros PostgREST.
- Uploads: buckets com limite de tamanho e MIME; caminho preso ao ID do painel do dono (política de Storage).
- Auditoria: `audit_logs` para mudanças de papel, status de conta, moderação de painel, configurações.
- Backup: diário automático (Supabase Pro). Complemento recomendado: `pg_dump` semanal para storage externo via
  GitHub Action agendada. Restauração: testar trimestralmente em projeto separado.
- Monitoramento: `/api/health`, logs estruturados JSON, Sentry opcional, alerta de falha de webhook (Fase 4).
- LGPD: solicitações de titulares com prazo (`due_at` 15 dias), anonimização de perfil (`anonymized_at`), opt-in de marketing.
