# Finance frontend — MDL 2/3

`src/features/finance/` é isolado do Auth V2: API, contratos gerados, money,
datas, hooks, formulários e páginas. Auth/provider/guards existentes continuam
responsáveis pela sessão. Finance usa o transporte Bearer existente; nunca
acessa tabelas Supabase diretamente nem adiciona service-role/secret key.

Rotas protegidas: `/finance`, `/finance/accounts`, `/finance/categories`,
`/finance/transactions`. Navegação principal passa a incluir Finanças;
`/app` e os fluxos Identity validados permanecem intactos.

QueryClient usa chaves privadas por owner. Logout/mudança de identidade limpa
o cache; mutation tardia de sessão anterior não repopula dados. AbortSignal é
propagado às queries. Mutations não têm retry automático e o formulário bloqueia
submissão dupla/Enter+click. Transferências preservam a chave idempotente em
retry da mesma submissão, sem chamar duas operações independentes.

`contracts.generated.ts` vem do gerador TypeBox do Back, não de um contrato
financeiro duplicado manualmente. O arquivo é versionado, autocontido e traz
SHA-256 da fonte; clonar Front não exige checkout Back em runtime/build.
Regenerar a partir do artefato publicado do Back, mantendo o cabeçalho.
Mais detalhes de Auth em [ARCHITECTURE](ARCHITECTURE.md).

## Monthly Budgeting

`/finance/budgets` permanece no mesmo bounded context e guard Auth V2.
`budget-pages.tsx` oferece navegação mensal/moeda, resumo, ritmo, progresso,
limites inline, desativação confirmada, cópia anterior e gastos sem orçamento.
Estados de loading, erro/retry e vazio são explícitos. Layout responsivo e
progressbar com texto/ícones não dependem apenas de cor.

`budget-hooks.ts` usa chaves owner+month+currency e o transporte autenticado
existente. Alterações invalidam as queries Finance do owner atual; sessão
tardia não repopula cache de outro usuário. Sem retry automático de writes.
`budget-view.ts` só apresenta valores/calendário: regras, gastos, rollover e
ritmo vêm do Back. Não conectar ao banco ou duplicar cálculo financeiro no UI.
Nenhuma alteração no singleton, callback, provider ou fluxo Auth aprovado.

## MDL 4 — Financial Goals

Rotas protegidas /finance/goals e /finance/goals/:goalId estendem FinanceLayout;
goal-pages implementa lista/filtros, criação/edição, detalhe, eventos e histórico.
goal-hooks usa queries privadas com owner e goal ID e histórico infinito paginado.
As mutações invalidam somente o owner ainda conectado. Transporte/JWT/cache/
Auth V2 são os existentes. Novos contratos Zod vêm do TypeBox do Back, sem
dependência de filesystem Back no runtime/build. Não há acesso direto ao banco.

Todos os read models (progresso, remaining, required, previsão e status derivado)
vêm do servidor. goal-view só agrupa strings monetárias com BigInt por currency
e fornece labels; a barra visual é limitada a 100%, com percentual real no texto.
Forms validam moeda/valor/prazo e não enviam owner ou campos derivados. O formulário
de evento retém a mesma chave+conteúdo se a resposta for incerta e o usuário repetir;
não há retry automático de writes. Meta ARCHIVED conserva leitura/histórico;
PAUSED precisa retomar para novos eventos. Nenhuma nova dependência de produção.

## MDL 5 — Front boundary

AuthV2Routes mounts protected RecurrencesPage and FinancialCalendarPage inside
FinanceLayout. Existing navigation adds Recorrências and Calendário. API methods
reuse authenticated transport and generated strict Back TypeBox → Zod contracts.
recurrence-hooks keys include private/finance/owner and list/radar/calendar filters;
list uses both cursor fields. Mutations invalidate only the connected owner, using
existing session safeguards. No backend source imports or direct database access.

RecurrenceEditor follows RHF/Zod form patterns, validates display amounts and
civil input dates/associations, then sends only the generated input/patch DTO.
recurrence-view supplies labels and localized DATE strings, never projections.
Calendar groups ordered server entries by day and renders server totals. All
projection computation stays in Back; tests use canned server date responses to
verify rendering and navigation, while Back tests prove the real calendar engine.
No new production packages or changes to Auth/account/budget/goal functionality.

## MDL 6 — Net Worth / Patrimônio

Implementado em `codex/mdl6-net-worth`, sem merge: patrimônio por moeda,
saldos assinados de contas somente leitura, itens externos, avaliações append-only,
posição histórica e arquivamento terminal. Sem FX, projeções ou alteração do ledger.
O gate humano ainda está pendente. Regras, API, schema, limites e roteiro estão em
[Net Worth](./net-worth.md).
