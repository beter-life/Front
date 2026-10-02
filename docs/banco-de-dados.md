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
