import type {
  BudgetAllocation,
  BudgetPeriod,
  BudgetSummary,
  Category,
} from '../../src/features/finance/contracts.generated';

export const metadata = { createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
export const category: Category = {
  ...metadata,
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Alimentação',
  kind: 'EXPENSE',
  isActive: true,
};
export const period: BudgetPeriod = {
  ...metadata,
  id: '55555555-5555-4555-8555-555555555555',
  month: '2026-10',
  currency: 'BRL',
  timeZone: 'America/Sao_Paulo',
};
export const allocation: BudgetAllocation = {
  ...metadata,
  id: '66666666-6666-4666-8666-666666666666',
  budgetPeriodId: period.id,
  categoryId: category.id,
  categoryName: category.name,
  categoryIsActive: true,
  currency: 'BRL',
  amountMinor: '50000',
  rolloverPolicy: 'NONE',
  isActive: true,
};
// Explicit API fixtures: tests exercise the real view/transport, not a duplicate budget algorithm.
export function budgetSummary(overrides: Partial<BudgetSummary> = {}): BudgetSummary {
  return {
    month: '2026-10',
    currency: 'BRL',
    timeZone: 'America/Sao_Paulo',
    periodId: period.id,
    from: '2026-10-01T03:00:00.000Z',
    to: '2026-11-01T03:00:00.000Z',
    daysInMonth: 31,
    elapsedDays: 15,
    canCopyPrevious: false,
    categories: [
      {
        allocationId: allocation.id,
        categoryId: category.id,
        categoryName: category.name,
        categoryIsActive: true,
        rolloverPolicy: 'NONE',
        baseMinor: '50000',
        rolloverMinor: '0',
        availableMinor: '50000',
        spentMinor: '10000',
        remainingMinor: '40000',
        utilizationPercent: '20.00',
        expectedSpendToDateMinor: '24193',
        paceStatus: 'ON_TRACK',
      },
    ],
    unbudgetedCategories: [],
    baseBudgetTotalMinor: '50000',
    rolloverTotalMinor: '0',
    budgetedTotalMinor: '50000',
    spentBudgetedMinor: '10000',
    remainingBudgetedMinor: '40000',
    unbudgetedSpendingMinor: '0',
    expenseTotalMinor: '10000',
    utilizationPercent: '20.00',
    expectedSpendToDateMinor: '24193',
    paceStatus: 'ON_TRACK',
    ...overrides,
  };
}
export function emptyBudget(overrides: Partial<BudgetSummary> = {}) {
  return budgetSummary({
    periodId: null,
    categories: [],
    baseBudgetTotalMinor: '0',
    budgetedTotalMinor: '0',
    spentBudgetedMinor: '0',
    remainingBudgetedMinor: '0',
    expenseTotalMinor: '0',
    utilizationPercent: null,
    expectedSpendToDateMinor: '0',
    ...overrides,
  });
}
