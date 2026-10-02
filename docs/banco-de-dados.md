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
