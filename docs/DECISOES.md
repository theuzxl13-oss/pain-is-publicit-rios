# Decisões comerciais pendentes

Cada item traz a **recomendação** e a **regra provisória** adotada no código/configuração. Nenhuma delas está
aprovada; todas são parametrizáveis (tabela `settings`, `commission_rules`) e podem mudar sem reestruturação.

| # | Pergunta | Recomendação | Regra provisória implementada |
|---|---|---|---|
| 1 | Quem paga a comissão? | Proprietário (preço exibido = preço final, mais simples para o anunciante) | `commission_rules.charged_to = 'owner'` (suporta `advertiser`) |
| 2 | Pagamento integral ou parcelado? | Integral no MVP; parcelamento no cartão com juros do comprador via checkout | Integral |
| 3 | Quando o proprietário recebe? | Após o início da veiculação + 2 dias (reduz risco de disputa) | `finance.payout_release_days = 2`, repasse manual registrado |
| 4 | Quem instala a publicidade? | Proprietário, informado no anúncio; custo à parte se houver | Campo “Regras de contratação” no painel |
| 5 | Produção da arte incluída? | Não; responsabilidade do anunciante salvo indicação | Idem |
| 6 | Aprovação administrativa de painéis? | Sim | `panels.require_admin_approval = true`; gatilho impede autopublicação |
| 7 | Período mínimo | Definido por painel | `panels.min_periods` + `billing_unit` |
| 8 | Regras de cancelamento | Escalonada por antecedência | Minuta em `/cancelamento` (15 dias integral, 15–7 dias 50%, <7 dias sem reembolso) |
| 9 | Documentos fiscais? | Plataforma emite NFS-e sobre a comissão; proprietário emite sobre a locação | Não implementado (futuro) — consultar contador |
| 10 | Contrato com assinatura? | Aceite eletrônico registrado no MVP; assinatura qualificada se jurídico exigir | Tabelas `contracts`/`contract_acceptances` com hash, IP e UA |
| 11 | Categorias iniciais | As 8 do requisito | Seed na migration de painéis; admin cria novas |
| 12 | Abrangência | Todo o Brasil | Filtro por UF; sem restrição geográfica |
| 13 | Preço negociável? | Sim, opcional por painel | `panels.price_negotiable`; contrapropostas sempre possíveis |
| 14 | Indisponibilidades e disputas | Chamado de suporte com mediação; reembolso proporcional | Minuta em `/cancelamento`; tópico “denúncia” no suporte |
| 15 | Comprovação de propriedade/autorização | Declaração no cadastro (MVP) + upload de documento na análise (futuro) | Declaração nos termos de uso |

Prazos operacionais provisórios (tabela `settings`):

- `booking.hold_minutes = 30` — reserva temporária durante o pagamento.
- `rental.request_ttl_hours = 72` — prazo para o proprietário responder.
- `rental.payment_ttl_hours = 48` — prazo para pagar após aprovação.
