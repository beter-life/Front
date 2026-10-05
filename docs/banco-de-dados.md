# Fronteira de dados Finance

Front não conecta ao PostgreSQL. Os dados financeiros persistem no schema `app`
do Back, em financial_accounts, financial_categories, financial_transactions e
financial_transfers, pela migration incremental `0003_finance_core`.

Todas as chamadas passam pela API Fastify com JWT da sessão Auth V2. O Back
aplica ownership e constraints; PostgreSQL tem RLS nas quatro tabelas. As policies
e a definição de schema são mantidas exclusivamente no repositório Back.
Nenhuma migration, segredo, DATABASE_URL ou CA deve ser copiada para Front.

Receitas/despesas e transferências são projetadas numa listagem paginada.
JSON monetário usa strings; o client valida respostas com o Zod gerado do
TypeBox. QueryClient guarda somente cache efêmero privado, não a fonte de verdade.
Reload solicita novamente os dados persistidos; logout remove acesso/cache.

MDL 3 acrescenta no Back `financial_budget_periods` e
`financial_budget_allocations` pela migration `0004_monthly_budgeting`, com
RLS, FKs compostas owner/currency/kind e limite BIGINT não negativo.
Período único por owner+mês+moeda e allocation única por período+categoria.
Remoção é desativação: nenhuma exclusão física pública. Timezone é snapshot do
perfil na criação; todos os cálculos são read models, não saldos persistidos.

Front usa os seis endpoints `/api/v1/finance/budgets/:month` pelo client gerado;
moeda explícita, owner fornecido somente pelo JWT no Back. Não passar ownership
ou timezone arbitrário. Nenhuma migration ou credencial de banco vai para Front.

MDL4 adiciona no Back as tabelas privadas app.financial_goals e
app.financial_goal_events pela migration incremental 0005_financial_goals,
com RLS e FK composta goal+owner. Idempotência única por owner+key. Eventos são
append-only; saldo/remaining/progresso são agregados derivados. Os clientes não
têm policy de escrita direta de eventos: somente o backend aplica as invariantes.
Schema app não foi exposto na Data API e nenhum grant remoto novo foi concedido.

O Front consome somente a API REST autenticada /api/v1/finance/goals e
/:goalId/events. Não enviar owner, moeda de evento, current ou campos calculados.
Histórico usa cursor occurredAt+id e limite de 50 por página no UI. Cache privado
inclui owner/goal; logout elimina acesso. Reload busca novamente dados persistidos.
Supabase DEV recebeu somente a migration revisada, após PostgreSQL/RLS PASS;
nenhum evento/meta foi inserido por SQL para simular gate humano.

## MDL 5 — Recurrence persistence through API

The Back's incremental 0006 adds only app.financial_recurrences with owner RLS,
positive BIGINT, explicit currency, bounded frequency/interval, civil DATEs and
status checks. Compound account+owner+currency and category+owner+kind FKs enforce
association integrity. app remains private and receives no Data API grants.
Dates, next occurrence, radar/calendar totals are derived, not materialized rows.

Front reads/writes through /api/v1/finance/recurrences and explicit status endpoints;
/calendar and /subscriptions/radar are read-only. Owner is never supplied by
client; foreign IDs return 404. Backend validates own active new associations,
preserving later-inactive existing links. List supports 50 UI / max100 API records
per page; projection rejects more than 500 eligible rules instead of silently
truncating totals. Reload reads persisted rules; forecasts never write old tables.
Migration applied to Supabase DEV after reviewed PostgreSQL17/RLS PASS with TLS
verify-full; all nine previous tables' exact row hashes unchanged. No remote test
records, resets or destructive migrations; local env/secrets remain preserved.

## MDL 6 — Net Worth / Patrimônio

MDL6 COMPLETE, integrado em `main`: patrimônio por moeda,
saldos assinados de contas somente leitura, itens externos, avaliações append-only,
posição histórica e arquivamento terminal. Sem FX, projeções ou alteração do ledger.
O gate humano foi aprovado em 2026-10-05. Regras, API, schema, limites e roteiro estão em
[Net Worth](./net-worth.md).

## MDL 7 — Yield Engine / Rendimentos

Front acessa somente endpoints JWT de Yield na API Finance. As três tabelas da
migration0008, constraints, RLS, cache BCB e triggers ficam exclusivamente no
Back. Não há migration, CA ou DATABASE_URL no browser. Generated Zod permanece
byte-idêntico ao artefato oficial do Back e valida profile/versões/estimativas.
Reads não criam transactions nem avaliações; mutation configura só profile/regra
ou arquiva profile. Logout remove acesso e cache privado; reload lê persistência.
Não há conexão direta do Front ao BCB, banco ou Data API.
