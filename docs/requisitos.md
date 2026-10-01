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

Gate real MDL 3 ainda pendente: usando sessão real, limite 500/despesa 100/
restante 400/utilização 20%, reload, edição e cópia do mês anterior. Não substituir
a aprovação humana por fixtures/API interceptada ou registros SQL.

Não implementado: metas/recorrência, cartão ou investimentos avançados,
importação, integração bancária, OpenFinance, IA, previsão, MDL 4+.
