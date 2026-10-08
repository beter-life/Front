import type { Account,Currency,SafeSpendWarning } from './contracts.generated';
export function eligibleSafeAccounts(accounts:Account[],currency:Currency) {return accounts.filter(a=>a.isActive&&a.currency===currency&&['checking','cash','savings','other'].includes(a.type));}
export const safeSpendWarnings:Record<SafeSpendWarning,string>={
  NO_BUDGET_FOR_CURRENT_MONTH:'Não há orçamento para este mês. O cálculo usa somente a capacidade de caixa.',
  POTENTIAL_RECURRENCE_OVERLAP:'Uma recorrência pode representar uma despesa já cadastrada. O cálculo conservador mantém ambas enquanto não houver reconciliação.',
  EXPECTED_INCOME_EXCLUDED_FROM_BASE:'Receitas previstas não aumentam o valor principal. O cenário separado é apenas uma projeção.',
  GOALS_ARE_PLANNING_ONLY:'Metas são planejamento declarativo. Somente o plano mensal restante foi considerado, não o saldo total da meta.',
  NO_RECURRENCE_RESERVE:'A reserva de recorrências está desativada. Essas despesas planejadas foram excluídas pela configuração.',
  NEGATIVE_LIQUID_ACCOUNT:'Uma conta selecionada possui saldo negativo. Esse valor reduz a liquidez.',
  LIMITED_DATA_COVERAGE:'Estimativa baseada nos dados cadastrados, não uma garantia. Revise obrigações vencidas e saldos legados fora deste horizonte.',
};
