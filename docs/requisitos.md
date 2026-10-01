# Requisitos Front Finance — MDL 2

Implementado: dashboard por moeda/período; lista/criação/edição/inativação de
contas; categorias de receita/despesa com criação e inativação; receitas/despesas
com categoria opcional; transferências de mesma moeda; listagem, filtros por
conta/categoria/tipo/datas e próxima/primeira página; cancelamento auditável.

Loading, estados vazios, validação monetária e feedback sanitizado de API são
acessíveis por teclado e funcionam em desktop/mobile no visual existente.
Moedas, BIGINT, timezone e ownership seguem contratos reais do Back.

Os testes de browser usam SDK Supabase e aplicação reais, interceptando apenas
Auth/API externos. Testes PostgreSQL/constraints/RLS pertencem ao Back. Gate
real manual obrigatório: duas contas, categoria, receita/despesa, saldo,
transferência e reload com sessão real em `http://localhost:3101/finance`.

Não implementado: orçamento/metas/recorrência, cartão ou investimentos avançados,
importação, integração bancária, OpenFinance, IA, previsão, MDL 3.
