import { z } from 'zod';
import type { ApiClient } from '../../api/client';
import * as C from './contracts.generated';
export function createFinanceApi(transport: ApiClient) {
  const base = '/api/v1/finance';
  const query = (values: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
    return '?' + params.toString();
  };
  const budgetPath = (month: string) => base + '/budgets/' + C.BudgetMonthSchema.parse(month);
  const budgetQuery = (currency: C.Currency) => query(C.BudgetCurrencyQuerySchema.parse({ currency }));
  return {
    goals: (filters: C.GoalQuery, signal?: AbortSignal) => transport.request(base + '/goals' + query(C.GoalQuerySchema.parse(filters)), z.array(C.GoalSchema), 'GET', undefined, signal),
    goal: (id: string, signal?: AbortSignal) => transport.request(base + '/goals/' + z.uuid().parse(id), C.GoalSchema, 'GET', undefined, signal),
    createGoal: (input: C.GoalInput) => transport.request(base + '/goals', C.GoalSchema, 'POST', C.GoalInputSchema.parse(input)),
    patchGoal: (id: string, input: C.GoalPatch) => transport.request(base + '/goals/' + z.uuid().parse(id), C.GoalSchema, 'PATCH', C.GoalPatchSchema.parse(input)),
    goalEvents: (id: string, filters: C.GoalEventsQuery, signal?: AbortSignal) => transport.request(base + '/goals/' + z.uuid().parse(id) + '/events' + query(C.GoalEventsQuerySchema.parse(filters)), C.GoalEventsPageSchema, 'GET', undefined, signal),
    addGoalEvent: (id: string, input: C.GoalEventInput) => transport.request(base + '/goals/' + z.uuid().parse(id) + '/events', C.GoalEventSchema, 'POST', C.GoalEventInputSchema.parse(input)),
    budget: (month: string, currency: C.Currency, signal?: AbortSignal) => transport.request(budgetPath(month) + budgetQuery(currency), C.BudgetViewSchema, 'GET', undefined, signal),
    budgetSummary: (month: string, currency: C.Currency, signal?: AbortSignal) => transport.request(budgetPath(month) + '/summary' + budgetQuery(currency), C.BudgetSummarySchema, 'GET', undefined, signal),
    ensureBudget: (month: string, input: C.BudgetPeriodInput) => transport.request(budgetPath(month), C.BudgetPeriodSchema, 'PUT', C.BudgetPeriodInputSchema.parse(input)),
    putBudgetAllocation: (month: string, categoryId: string, input: C.BudgetAllocationInput) => transport.request(budgetPath(month) + '/categories/' + z.uuid().parse(categoryId), C.BudgetAllocationSchema, 'PATCH', C.BudgetAllocationInputSchema.parse(input)),
    removeBudgetAllocation: (month: string, categoryId: string, currency: C.Currency) => transport.request(budgetPath(month) + '/categories/' + z.uuid().parse(categoryId) + budgetQuery(currency), C.BudgetAllocationSchema, 'DELETE'),
    copyBudgetPrevious: (month: string, input: C.BudgetPeriodInput) => transport.request(budgetPath(month) + '/copy-previous', C.BudgetCopyResultSchema, 'POST', C.BudgetPeriodInputSchema.parse(input)),
    accounts: (signal?: AbortSignal) =>
      transport.request(base + '/accounts', z.array(C.AccountSchema), 'GET', undefined, signal),
    createAccount: (input: C.AccountInput) =>
      transport.request(
        base + '/accounts',
        C.AccountSchema,
        'POST',
        C.AccountInputSchema.parse(input),
      ),
    patchAccount: (id: string, input: C.AccountPatch) =>
      transport.request(
        base + '/accounts/' + z.uuid().parse(id),
        C.AccountSchema,
        'PATCH',
        C.AccountPatchSchema.parse(input),
      ),
    categories: (signal?: AbortSignal) =>
      transport.request(base + '/categories', z.array(C.CategorySchema), 'GET', undefined, signal),
    createCategory: (input: C.CategoryInput) =>
      transport.request(
        base + '/categories',
        C.CategorySchema,
        'POST',
        C.CategoryInputSchema.parse(input),
      ),
    patchCategory: (id: string, input: C.CategoryPatch) =>
      transport.request(
        base + '/categories/' + z.uuid().parse(id),
        C.CategorySchema,
        'PATCH',
        C.CategoryPatchSchema.parse(input),
      ),
    transactions: (filters: C.TransactionQuery, signal?: AbortSignal) =>
      transport.request(
        base + '/transactions' + query(C.TransactionQuerySchema.parse(filters)),
        C.TransactionPageSchema,
        'GET',
        undefined,
        signal,
      ),
    createTransaction: (input: C.TransactionInput) =>
      transport.request(
        base + '/transactions',
        C.TransactionSchema,
        'POST',
        C.TransactionInputSchema.parse(input),
      ),
    patchTransaction: (id: string, input: C.TransactionPatch) =>
      transport.request(
        base + '/transactions/' + z.uuid().parse(id),
        C.TransactionSchema,
        'PATCH',
        C.TransactionPatchSchema.parse(input),
      ),
    createTransfer: (input: C.TransferInput) =>
      transport.request(
        base + '/transfers',
        C.TransferSchema,
        'POST',
        C.TransferInputSchema.parse(input),
      ),
    patchTransfer: (id: string, input: C.TransferPatch) =>
      transport.request(
        base + '/transfers/' + z.uuid().parse(id),
        C.TransferSchema,
        'PATCH',
        C.TransferPatchSchema.parse(input),
      ),
    summary: (from: string, to: string, signal?: AbortSignal) =>
      transport.request(
        base + '/summary' + query(C.SummaryQuerySchema.parse({ from, to })),
        C.SummarySchema,
        'GET',
        undefined,
        signal,
      ),
  };
}
