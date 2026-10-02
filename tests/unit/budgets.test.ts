import { describe, expect, it, vi } from 'vitest';
import {
  budgetAmountInput,
  budgetMonthLabel,
  budgetPercentLabel,
  budgetProgress,
  currentBudgetMonth,
  shiftBudgetMonth,
  validBudgetMonth,
} from '../../src/features/finance/budget-view';
import {
  BudgetAllocationInputSchema,
  BudgetPeriodInputSchema,
} from '../../src/features/finance/contracts.generated';
import { createApiClient } from '../../src/api/client';
import { createFinanceApi } from '../../src/features/finance/api';
import { allocation, budgetSummary, category, period } from '../fixtures/budgets';

describe('budget presentation and generated contracts', () => {
  it('navigates calendar months using the profile timezone, not the server timezone', () => {
    const instant = new Date('2026-10-01T01:00:00Z');
    expect(currentBudgetMonth('America/Sao_Paulo', instant)).toBe('2026-09');
    expect(currentBudgetMonth('UTC', instant)).toBe('2026-10');
    expect(shiftBudgetMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftBudgetMonth('2026-12', 1)).toBe('2027-01');
    expect(budgetMonthLabel('2026-10', 'pt-BR')).toBe('outubro de 2026');
    for (const invalid of ['2026-13', '2026-1', '9999-01', '0000-01'])
      expect(validBudgetMonth(invalid)).toBe(false);
  });
  it('formats exact money, nullable and huge utilization without rounding the amount', () => {
    expect(budgetAmountInput('9007199254740993', 'BRL')).toBe('90071992547409.93');
    expect(budgetAmountInput('100', 'JPY')).toBe('100');
    expect(budgetAmountInput('1234', 'KWD')).toBe('1.234');
    expect(budgetPercentLabel('20.00')).toBe('20%');
    expect(budgetPercentLabel('33.33')).toBe('33,33%');
    expect(budgetPercentLabel(null)).toBe('Sem limite disponível');
    expect(budgetProgress('1844674407370955161400.00')).toBe(100);
    expect(budgetProgress('33.33')).toBe(33.33);
    expect(budgetProgress(null)).toBe(0);
  });
  it('rejects client ownership, negative allocations and unknown rollover/currency', () => {
    const body = { currency: 'BRL', amountMinor: '0', rolloverPolicy: 'NONE' };
    expect(BudgetAllocationInputSchema.safeParse(body).success).toBe(true);
    for (const extra of [
      { amountMinor: '-1' },
      { amountMinor: '1.5' },
      { auth_user_id: category.id },
      { rolloverPolicy: 'NEGATIVE' },
      { currency: 'ZZZ' },
    ])
      expect(BudgetAllocationInputSchema.safeParse({ ...body, ...extra }).success).toBe(false);
    expect(BudgetPeriodInputSchema.safeParse({ currency: 'BRL', timezone: 'UTC' }).success).toBe(
      false,
    );
  });
  it('uses the generated schemas for all six authenticated budget operations', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const api = createFinanceApi(
      createApiClient('https://api.example.test', () => 'synthetic-access', vi.fn(), fetcher),
    );
    fetcher.mockResolvedValueOnce(
      Response.json({
        month: period.month,
        currency: period.currency,
        timeZone: period.timeZone,
        period,
        allocations: [allocation],
        canCopyPrevious: true,
      }),
    );
    await api.budget('2026-10', 'BRL');
    fetcher.mockResolvedValueOnce(Response.json(period));
    await api.ensureBudget('2026-10', { currency: 'BRL' });
    fetcher.mockResolvedValueOnce(Response.json(allocation));
    await api.putBudgetAllocation('2026-10', category.id, {
      currency: 'BRL',
      amountMinor: '50000',
      rolloverPolicy: 'NONE',
    });
    fetcher.mockResolvedValueOnce(Response.json({ ...allocation, isActive: false }));
    await api.removeBudgetAllocation('2026-10', category.id, 'BRL');
    fetcher.mockResolvedValueOnce(
      Response.json({ period, copiedCount: 1, alreadyPresentCount: 0, skippedInactiveCount: 0 }),
    );
    await api.copyBudgetPrevious('2026-10', { currency: 'BRL' });
    fetcher.mockResolvedValueOnce(Response.json(budgetSummary()));
    await api.budgetSummary('2026-10', 'BRL');
    expect(fetcher.mock.calls.map((c) => c[1]?.method)).toEqual([
      'GET',
      'PUT',
      'PATCH',
      'DELETE',
      'POST',
      'GET',
    ]);
    expect(String(fetcher.mock.calls[3]?.[0])).toBe(
      `https://api.example.test/api/v1/finance/budgets/2026-10/categories/${category.id}?currency=BRL`,
    );
    for (const [, init] of fetcher.mock.calls)
      expect(init?.headers).toMatchObject({ authorization: 'Bearer synthetic-access' });
    expect(() => api.ensureBudget('2026-13', { currency: 'BRL' })).toThrow();
    expect(fetcher).toHaveBeenCalledTimes(6);
  });
});
