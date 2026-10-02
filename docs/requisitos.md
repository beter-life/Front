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
integração bancária, OpenFinance, IA, rendimento ou MDL5+.

## MDL 4 — Metas financeiras (AWAITING_REAL_GATE)

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
O gate real deve criar Reserva teste 10.000 BRL/plano 1.000/prazo futuro, contribuir
2.500, reload, retirar 500, editar alvo para 12.000, pausar/retomar, conferir
projeção/ownership e ausência de efeitos financeiros. Não inserir registros por SQL.
REAL_GATE=PENDING; READY_FOR_MDL5=false. Não mesclar MDL4 nesta execução.
