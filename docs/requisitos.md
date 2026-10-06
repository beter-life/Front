# Requisitos Front Finance — MDL 2/3

Implementado: dashboard por moeda/período; lista/criação/edição/inativação de
contas; categorias de receita/despesa com criação e inativação; receitas/despesas
com categoria opcional; transferências de mesma moeda; listagem, filtros por
conta/categoria/tipo/datas e próxima/primeira página; cancelamento auditável.

Loading, estados vazios, validação monetária e feedback sanitizado de API são
acessíveis por teclado e funcionam em desktop/mobile no visual existente.
Moedas, BIGINT, timezone e ownership seguem contratos reais do Back.

Os testes de browser usam SDK Supabase e aplicação reais, interceptando apenas
Auth/API externos. Testes PostgreSQL/constraints/RLS pertencem ao Back. Gate
real manual aprovado pelo usuário: contas, categorias, receita, despesa,
transferência, saldos e reload com persistência no Supabase passaram usando
sessão real em `/finance`.

## MDL 3 — Orçamento mensal

Implementado em `/finance/budgets`: mês anterior/seguinte e seletor nativo,
moeda separada, criar período vazio/copiar anterior, incluir/editar limite
EXPENSE, zero permitido, policy NONE/POSITIVE_ONLY e remover com confirmação.
Categorias inativas aparecem no histórico, mas não são opções de novos limites.

Resumo disponível/base/sobra, gasto total, restante planejado; categoria com
planejado/gasto/restante, percentual e progressbar acessível. Ritmo ON_TRACK /
ATTENTION / OVER_BUDGET com texto/ícone; gastos sem limite ou categoria visíveis.
Sem modais para edição. Navegação, reload, validação local, erros API, loading,
desktop/mobile e regressão Auth/Finance têm testes automatizados.

Gate real MDL 3 aprovado pelo usuário em 2026-10-02: orçamento, despesa,
cálculos, reload, edição, copy previous e ownership PASS.

Não implementado: recorrência, cartão ou investimentos avançados, importação,
integração bancária, OpenFinance, IA, rendimento ou MDL6+.

## MDL 4 — Metas financeiras (COMPLETE)

Lista com filtros status/currency, prioridade e totais separados por moeda;
estados vazio/loading/erro. Form nome, descrição opcional, alvo, moeda, mês de
prazo opcional, plano mensal opcional e prioridade. Moeda é imutável na edição.
Detalhe mostra current/target/remaining/progresso, prazo, planned/required monthly,
previsão sem rendimento e status persistido/derivado. Eventos contribution/withdrawal
com valor, data e nota; histórico paginado, pause/resume/archive e reload.
ARCHIVED fica consultável por filtro, com ações bloqueadas; PAUSED bloqueia eventos.

Desktop/tablet/mobile/teclado, labels, ícones e progressbar com texto real são
testados; não depender de cor. UI explica planejamento e ausência de efeito em
contas/transações/transferências/budgets. Testes interceptados não substituem gate.
Exemplo do fluxo de gate: criar Reserva teste 10.000 BRL/plano 1.000/prazo futuro, contribuir
2.500, reload, retirar 500, editar alvo para 12.000, pausar/retomar, conferir
projeção/ownership e ausência de efeitos financeiros. Não inserir registros por SQL.
META/CONTRIBUIÇÃO/RETIRADA/CÁLCULOS/RELOAD/EDIÇÃO/PAUSE_RESUME/PROJEÇÃO/
ISOLAMENTO_FINANCEIRO/OWNERSHIP=PASS. REAL_GATE=PASS; READY_FOR_MDL5=true.
MDL4, MDL5 e MDL6 integrados em main após gates verdes.

## MDL 5 — Recurrences and Calendar

Implemented and integrated into main; MDL0–MDL5 approved ancestry is preserved.
STATUS=COMPLETE; REAL_GATE=PASS; READY_FOR_MDL6=true.

/finance/recurrences: owned paginated list (50/page), status/type/kind/currency/
account/category filters; RHF/Zod create/edit form for name/description/type/
kind/money/currency/optional account/category/frequency/interval/start/end;
SUBSCRIPTION forces EXPENSE; type/currency fixed in edit; compatible active new
links only. Existing inactive links are labelled and retained for unrelated edits.
Pause/resume invalidates owned list/radar/calendar. Archive requires confirmation
and preserves terminal rule visibility through filters. Retry/loading/empty/
validation/errors remain explicit; no fabricated success or financial balances.

Radar: ACTIVE user-entered subscriptions, next date and actual charges within
server [today,today+30), total by currency. Repeated weekly occurrences all count;
future/ended subscriptions can have zero charges. No monthly equivalents.
/finance/calendar: compact month navigation and chronological agenda by civil
DATE; filters currency/type/kind; server income, expense and projected net per
currency. Net is not available balance. It shows only recurrence projections;
confirmed/future registered transactions remain in Movimentos, with no matching.

Responsive desktop/tablet/mobile; keyboard, labels, icons plus status text;
localized civil dates retain API YYYY-MM-DD. Forms reject invalid money, range,
interval and incompatible associations before writes. Server enforces ownership
and invariant validation; protected routes/cache use the existing Auth V2.

Human gate at http://localhost:3101/finance/recurrences: create monthly Assinatura
teste, 100 BRL, start 2026-10-31. Check 31/10, 30/11, 31/12, 31/01 in calendar,
radar actual dates in its displayed window, edit and reload. Pause should remove
calendar/radar projections and resume should restore them. Verify terminal
archive; income and optional USD retain separate totals. Confirm account balances,
transactions, transfers, budgets and goals remain unchanged. Another user checks
ownership when available. Automated intercepted browser tests do not certify
hosted human behavior; no SQL fixtures substitute the gate. The human gate is
approved; MDL5 is COMPLETE and merged.

## MDL 6 — Net Worth / Patrimônio

MDL6 COMPLETE, integrado em `main`: patrimônio por moeda,
saldos assinados de contas somente leitura, itens externos, avaliações append-only,
posição histórica e arquivamento terminal. Sem FX, projeções ou alteração do ledger.
O gate humano foi aprovado em 2026-10-05. Regras, API, schema, limites e roteiro estão em
[Net Worth](./net-worth.md).

## MDL 7 — Yield Engine / Rendimentos

`/finance/yield`: benchmarks com fonte/unidade/data e estados atual/desatualizado/
indisponível; resumo30 dias por moeda; configuração explícita em conta ativa;
ZERO/fixa/CDI/Selic/poupança, carência/teto/impostos; versões e histórico retidos.
Projeções30/90/365 dias ou data personalizada, bruto/líquido/IR/IOF separados;
comparação BRL de CDI100%,poupança e fixa sem criar contas. Arquivamento exige
confirmação e é terminal. Contas inativas/arquivadas mantêm histórico sem futuro.
Loading/vazio/erro/retry e labels/teclado/layout desktop/tablet/mobile usam o
visual existente. Nenhum ganho estimado aparece como saldo/patrimônio real.
Gate hospedado humano aprovado pelo usuário em 2026-10-05 (PASS); testes automatizados são evidência complementar:
[roteiro](./YIELD_ENGINE.md#gate-humano-aprovado). MDL8 fora do escopo.

## MDL9 — Dívidas e quitação

API privada de dívidas, termos versionados, pagamentos atômicos/idempotentes, payoff/arquivo e correção controlada. Simulador de até20 dívidas da mesma moeda por até600 meses; comparação e schedule opt-in. Gate humano aprovado (REAL_GATE=PASS). [Contrato e limites](./DEBT_PAYOFF.md).
