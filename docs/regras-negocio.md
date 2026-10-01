# Apresentação Finance

- Money JSON é string inteira em minor units. `money.ts` centraliza parse/format
  exato via BigInt, sem conversão monetária para float e sem `/100` espalhado.
- BRL é padrão. O catálogo gerado permite zero, duas e três casas. Vírgula/ponto
  são separadores decimais; milhar ambíguo, excesso de casas e valor fora de BIGINT
  são rejeitados, nunca arredondados silenciosamente.
- Conta nasce com abertura; editar não muda moeda/abertura nem saldo arbitrário.
- Transferência tem origem/destino distintos, mesma moeda e operação única.
- Cancelamento mantém registro e remove efeitos no saldo. Inativação preserva
  contas/categorias no histórico e não oferece seleção para novas operações.
- O backend é a autoridade para regras/ownership; UI não decide auth_user_id.
- Datas usam o timezone do perfil; fallback explícito UTC. `dates.ts` converte
  `datetime-local` em instante UTC, rejeita horários DST inexistentes e apresenta
  `occurredAt` no perfil. Datas finais de filtro são inclusivas na UI e convertidas
  para o início do próximo dia no contrato `[from,to)`.
- Summary separa moedas; receitas/despesas/net pertencem ao período selecionado;
  saldo é até o fim do período, não previsão. Contas também exibem saldo atual.
