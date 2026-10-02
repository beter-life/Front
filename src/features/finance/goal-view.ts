import type { Goal, Currency } from './contracts.generated';
export const goalStatusLabels = { ACTIVE: 'Ativa', PAUSED: 'Pausada', ARCHIVED: 'Arquivada' };
export const goalPriorityLabels = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta' };
export const goalPlanLabels = { ACHIEVED: 'Meta atingida', ON_TRACK: 'No caminho', ATTENTION: 'Requer atenção', OVERDUE: 'Prazo vencido', NO_PLAN: 'Sem plano suficiente' };
export function goalTotals(goals: Goal[]) {
  const currencies = new Map<Currency, { currency: Currency; current: bigint; target: bigint; remaining: bigint }>();
  for (const goal of goals) {
    const total = currencies.get(goal.currency) ?? { currency: goal.currency, current: 0n, target: 0n, remaining: 0n };
    total.current += BigInt(goal.currentAmountMinor); total.target += BigInt(goal.targetAmountMinor); total.remaining += BigInt(goal.remainingAmountMinor);
    currencies.set(goal.currency, total);
  }
  return [...currencies.values()];
}
