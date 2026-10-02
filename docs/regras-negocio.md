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

## Apresentação de orçamento

- Mês atual vem do timezone do perfil; período criado guarda o timezone no Back
  para não deslocar histórico quando o perfil mudar. UI mostra o calendário usado.
- Limite base não negativo, string inteira exata; zero permitido. Editar usa
  conversão BigInt com o expoente da moeda, sem arredondar valores grandes.
- Disponível = base + sobra; restante = disponível − gasto. Percentual exato
  truncado a duas casas vem do Back, null se disponível zero. Progressbar limita
  apenas largura visual a 100%, mantendo texto real mesmo com overspending.
- POSITIVE_ONLY no destino recebe sobra positiva do mês imediatamente anterior
  encerrado, mesma moeda/categoria. NONE ou mês/limite ausente quebra a cadeia.
  Nunca carregar dívida; mês futuro não prevê sobra do mês ainda aberto.
- Copy preserva limites existentes (inclusive removidos); copia base/policy e
  categorias ativas, não gastos. Repetição não duplica.
- Remover limite preserva dados e mostra suas despesas em sem orçamento.
  Categoria inativa mantém história, mas não é sugerida para novos limites.
- Gastos: EXPENSE da moeda/intervalo mensal, não canceladas; incluir lançamentos
  futuros já registrados no mês. Income/transfer não contam. Sem conversão FX.
- Restante planejado considera categorias com limite. Total gasto e ritmo geral
  também incluem sem orçamento/sem categoria para não esconder despesas.
- Referência = floor(disponível × dias transcorridos / dias do mês), incluindo
  hoje. Futuro: zero dias; encerrado: mês inteiro. OVER_BUDGET se gasto > limite;
  senão ATTENTION se acima da referência; senão ON_TRACK. Não é previsão ou conselho.
