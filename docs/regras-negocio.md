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

## MDL 4 — Metas como planejamento

- Eventos não são movimentações de conta. Somar contributions e subtrair withdrawals
  apenas na meta; nunca alterar saldo/account/transaction/transfer/budget.
- Moeda fixa e explícita na criação; eventos herdam a moeda da meta. Valores JSON
  em minor-unit strings, parse/format com BigInt, sem somar moedas distintas.
- Current, remaining=max(target-current,0), percentual e projeções vêm do Back.
  Percentual tem truncamento inteiro em duas casas: 2.000/12.000 → 16,66%.
  Texto mostra >100%; barra limita a 100%. Editar alvo recalcula sem alterar eventos.
- Prazo é YYYY-MM no timezone atual do perfil. Slots incluem mês atual. Required
  monthly = ceil(remaining/slots); atingida 0; sem prazo/prazo vencido não atingido
  null. Plano opcional/zero não gera previsão. Previsão sem rendimento assume primeira
  contribuição no mês atual: atual+ceil(remaining/planned)-1. Atingida: mês atual.
  Projeção além de 9998-12 é null. UI não duplica cálculos do servidor.
- Persistido ACTIVE/PAUSED/ARCHIVED é separado de ACHIEVED/ON_TRACK/ATTENTION/
  OVERDUE/NO_PLAN. Precedência: atingida; prazo passado; prazo+plano (zero é plano
  insuficiente) comparado ao required; senão NO_PLAN. Prioridade não altera dinheiro.
- PAUSED bloqueia eventos até retomar; ARCHIVED é terminal e preserva leitura/
  histórico, sem novos eventos/edição. Corrigir movimento com evento compensatório.
- Mesmo owner+idempotency UUID+conteúdo normalizado replay seguro, inclusive após
  pause/archive. Mesmo UUID e conteúdo diferente: 409. Retirada acima de current
  bloqueada localmente e no servidor. Repetir resposta incerta preserva chave/payload.
- Não há juros, Yield Engine, automatização, Conflict Detector, Safe to Spend,
  simulação, investimentos, IA, Open Finance, notificações ou MDL6+.

## MDL 5 — Planning expectations

The Front never computes an occurrence engine or turns recurrence into a real
transaction. New/edit/status actions call only recurrence endpoints; account and
category APIs are read for association choices. Type/currency are fixed after
creation; subscriptions force expense, changing currency clears account choice,
changing type clears category choice. Existing inactive links remain selectable
only for their own unchanged edit. Archive is terminal and requires confirmation.

Amount input/output reuses exact Money utilities and supported exponents; API
sends integer minor-unit strings. Backend uses original weekly/monthly/yearly
anchor with interval 1–52/1–24/1–10 and inclusive optional end. Monthly Jan31
clamps Feb28 then restores Mar31; leap-year Feb29 returns after ordinary Feb28.
All projected dates are YYYY-MM-DD, years 1000–9998, never parsed as UTC midnight;
localized display inserts the calendar components into a constant locale template.
Profile timezone defines server today and default calendar month (UTC fallback).

Calendar [from,to) spans at most 366 days, monthly UI asks for first-of-month to
first-of-next-month. Totals remain separate currencies; projected net is income
minus expense, not available account balance. Radar sums actual occurrences in
[today,today+30), including repeated weekly charges, not monthly equivalents.
Only ACTIVE rules project; paused/archived next date is absent. No inference,
reconciliation, automatic posting, financial ingestion or MDL6 behavior.
