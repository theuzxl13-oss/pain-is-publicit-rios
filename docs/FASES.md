# Status das fases

## Fase 1 — Fundação ✅

### Implementado

- Projeto Next.js 15 + TypeScript estrito, Tailwind, componentes no padrão shadcn/ui, ESLint, Prettier, CI (GitHub Actions).
- **Banco completo** (10 migrations): todas as entidades do requisito, enums, índices, constraints, gatilhos, RLS
  em 100% das tabelas, privilégios por coluna, buckets de Storage com políticas, auditoria.
- Regra fundamental de não-conflito de reservas implementada no banco (exclusion constraint + locks + expiração de holds).
- Máquina de estados das solicitações no banco, espelhada em TypeScript (teste garante que não divergem).
- Autenticação Supabase: cadastro (anunciante/proprietário/ambos, CPF/CNPJ validados, empresa, aceite de termos),
  login, logout, confirmação de e-mail, recuperação e redefinição de senha, troca de senha com reautenticação.
- Proteção de rotas em três camadas: middleware (autenticação) → layouts do servidor (papel) → RLS.
- Rate limit compartilhado no banco para login, cadastro, recuperação de senha e suporte.
- Layout público premium e responsivo: home com banner, busca, painéis publicados, como funciona, categorias,
  vantagens, FAQ e rodapé; páginas Explorar (filtros por texto, UF, categoria, ordenação, paginação), página do
  painel (leitura), Como funciona, Anuncie, Central de ajuda, Suporte (formulário real → chamados), Termos,
  Privacidade e Cancelamento (minutas).
- Área logada: dashboards de anunciante, proprietário e admin com indicadores reais (RPCs), Minha conta
  (dados, empresa, habilitar perfil, senha, solicitações LGPD).
- Estados de carregamento, erros amigáveis, 404, acessibilidade (skip link, labels, aria-invalid, foco visível,
  reduced motion), cabeçalhos de segurança, `/api/health`.

### Testado

- `npm run test:db` — migrations aplicadas em PostgreSQL 16 e ~60 asserções: saneamento do cadastro, bloqueio de
  autoatribuição de admin, RLS de perfis/painéis/solicitações/reservas/financeiro/suporte, privilégios por coluna,
  moderação de painéis, transições de status, **conflito de reservas**, expiração de holds, bloqueios manuais,
  precedência de comissões, rate limit, conta suspensa, indicadores por papel.
- `npm test` — 39 testes unitários (CPF/CNPJ, schemas de cadastro, permissões, rotas protegidas, open redirect,
  comissão — incluindo o exemplo R$ 2.000 / 10%, estimativa de preço, máquina de estados, saneamento de busca).
- `npm run test:e2e` — 46 testes (desktop + mobile): páginas públicas, busca, proteção de rotas, validação de
  formulários, menu mobile, ausência de rolagem horizontal, headers de segurança, 404.
- `lint`, `typecheck` e `build` sem erros.

### Pendente / limitações conhecidas

- **Não testado contra um projeto Supabase real** (nenhuma credencial disponível): login/cadastro foram validados
  em nível de formulário e de banco, mas o fluxo ponta a ponta com o Supabase Auth precisa ser homologado assim que
  o projeto for criado. O stub de testes emula apenas o necessário de `auth`/`storage`.
- Tipos do banco escritos à mão nos repositórios; gerar com `supabase gen types` quando houver projeto.
- Mapa, cadastro de painéis e upload: Fase 2. A página do painel ainda não tem calendário nem solicitação;
  o botão “Tenho interesse” leva ao contato comercial (ação real, não simulada).
- CSP completa e Sentry: Fase 6.
- Textos jurídicos são minutas e precisam de revisão profissional.

## Fase 2 — Marketplace (próxima)

CRUD de painéis com upload validado (tipo/tamanho/dimensões), geocodificação de endereço (interface
`Geocoder`), mapa Leaflet com clusters e busca por área visível, filtros por preço/dimensões/iluminação/
disponibilidade/período, ordenação por proximidade, página do painel com galeria, mapa, calendário de ocupação e
estimativa de valor, fila de aprovação de painéis no admin e gestão de categorias.
