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
    debts: (signal?: AbortSignal) => transport.request(base + '/debts', z.array(C.DebtSchema), 'GET', undefined, signal),
    debt: (id: string, signal?: AbortSignal) => transport.request(base + '/debts/' + z.uuid().parse(id), C.DebtViewSchema, 'GET', undefined, signal),
    debtSummary: (signal?: AbortSignal) => transport.request(base + '/debts/summary', C.DebtSummarySchema, 'GET', undefined, signal),
    createDebt: (input: C.DebtInput) => transport.request(base + '/debts', C.DebtSchema, 'POST', C.DebtInputSchema.parse(input)),
    patchDebt: (id: string, input: C.DebtPatch) => transport.request(base + '/debts/' + z.uuid().parse(id), C.DebtSchema, 'PATCH', C.DebtPatchSchema.parse(input)),
    archiveDebt: (id: string) => transport.request(base + '/debts/' + z.uuid().parse(id) + '/archive', C.DebtSchema, 'POST', {}),
    addDebtTerm: (id: string, input: C.DebtTermInput) => transport.request(base + '/debts/' + z.uuid().parse(id) + '/terms', C.DebtTermSchema, 'POST', C.DebtTermInputSchema.parse(input)),
    debtPayments: (id: string, filters: C.DebtPaymentQuery = {}, signal?: AbortSignal) => transport.request(base + '/debts/' + z.uuid().parse(id) + '/payments' + query(C.DebtPaymentQuerySchema.parse(filters)), C.DebtPaymentPageSchema, 'GET', undefined, signal),
    payDebt: (id: string, input: C.DebtPaymentInput) => transport.request(base + '/debts/' + z.uuid().parse(id) + '/payments', C.DebtPaymentSchema, 'POST', C.DebtPaymentInputSchema.parse(input)),
    cancelDebtPayment: (id: string, paymentId: string) => transport.request(base + '/debts/' + z.uuid().parse(id) + '/payments/' + z.uuid().parse(paymentId) + '/cancel', C.DebtPaymentSchema, 'POST', {}),
    simulateDebts: (input: C.DebtSimulationInput) => transport.request(base + '/debts/simulate', C.DebtSimulationResponseSchema, 'POST', C.DebtSimulationInputSchema.parse(input)),
    cards: (signal?: AbortSignal) => transport.request(base + '/cards', z.array(C.CardSchema), 'GET', undefined, signal),
    card: (id: string, signal?: AbortSignal) => transport.request(base + '/cards/' + z.uuid().parse(id), C.CardViewSchema, 'GET', undefined, signal),
    cardsSummary: (signal?: AbortSignal) => transport.request(base + '/cards/summary', C.CardsSummarySchema, 'GET', undefined, signal),
    createCard: (input: C.CardInput) => transport.request(base + '/cards', C.CardSchema, 'POST', C.CardInputSchema.parse(input)),
    patchCard: (id: string, input: C.CardPatch) => transport.request(base + '/cards/' + z.uuid().parse(id), C.CardSchema, 'PATCH', C.CardPatchSchema.parse(input)),
    archiveCard: (id: string) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/archive', C.CardSchema, 'POST', {}),
    cardRules: (id: string, signal?: AbortSignal) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/billing-rules', z.array(C.BillingRuleSchema), 'GET', undefined, signal),
    addCardRule: (id: string, input: C.BillingRuleInput) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/billing-rules', C.BillingRuleSchema, 'POST', C.BillingRuleInputSchema.parse(input)),
    cardPurchases: (id: string, filters: C.PurchaseQuery = {}, signal?: AbortSignal) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/purchases' + query(C.PurchaseQuerySchema.parse(filters)), C.PurchasePageSchema, 'GET', undefined, signal),
    createCardPurchase: (id: string, input: C.PurchaseInput) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/purchases', C.PurchaseSchema, 'POST', C.PurchaseInputSchema.parse(input)),
    patchCardPurchase: (id: string, purchaseId: string, input: C.PurchasePatch) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/purchases/' + z.uuid().parse(purchaseId), C.PurchaseSchema, 'PATCH', C.PurchasePatchSchema.parse(input)),
    cancelCardPurchase: (id: string, purchaseId: string) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/purchases/' + z.uuid().parse(purchaseId) + '/cancel', C.PurchaseSchema, 'POST', {}),
    cardInvoices: (id: string, filters: C.InvoiceQuery = {}, signal?: AbortSignal) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/invoices' + query(C.InvoiceQuerySchema.parse(filters)), z.array(C.InvoiceSchema), 'GET', undefined, signal),
    cardInvoice: (id: string, closingDate: string, signal?: AbortSignal) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/invoices/' + z.iso.date().parse(closingDate), C.InvoiceSchema, 'GET', undefined, signal),
    payCard: (id: string, input: C.PaymentInput) => transport.request(base + '/cards/' + z.uuid().parse(id) + '/payments', C.PaymentSchema, 'POST', C.PaymentInputSchema.parse(input)),
    yieldBenchmarks: (signal?:AbortSignal)=>transport.request(base+'/yield/benchmarks',C.YieldBenchmarksSchema,'GET',undefined,signal),
    yieldProfiles: (signal?:AbortSignal)=>transport.request(base+'/yield/profiles',C.YieldProfilesSchema,'GET',undefined,signal),
    yieldProfile: (id:string,signal?:AbortSignal)=>transport.request(base+'/accounts/'+z.uuid().parse(id)+'/yield-profile',C.YieldProfileResultSchema,'GET',undefined,signal),
    saveYieldRule: (id:string,input:C.YieldRuleInput,creating:boolean)=>transport.request(base+'/accounts/'+z.uuid().parse(id)+'/yield-profile'+(creating?'':'/versions'),C.YieldProfileSchema,'POST',C.YieldRuleInputSchema.parse(input)),
    archiveYield: (id:string)=>transport.request(base+'/accounts/'+z.uuid().parse(id)+'/yield-profile/archive',C.YieldProfileSchema,'POST',{}),
    yieldEstimate: (id:string,filters:C.YieldEstimateQuery,signal?:AbortSignal)=>transport.request(base+'/accounts/'+z.uuid().parse(id)+'/yield/estimate'+query(C.YieldEstimateQuerySchema.parse(filters)),C.YieldEstimateSchema,'GET',undefined,signal),
    yieldSummary: (filters:C.YieldEstimateQuery,signal?:AbortSignal)=>transport.request(base+'/yield/summary'+query(C.YieldEstimateQuerySchema.parse(filters)),C.YieldSummarySchema,'GET',undefined,signal),
    yieldComparison: (input:C.YieldComparisonInput)=>transport.request(base+'/yield/comparison',C.YieldComparisonSchema,'POST',C.YieldComparisonInputSchema.parse(input)),
    netWorth: (filters:C.NetWorthQuery={},signal?:AbortSignal) => transport.request(base+'/net-worth'+query(C.NetWorthQuerySchema.parse(filters)),C.NetWorthSummarySchema,'GET',undefined,signal),
    netWorthHistory: (filters:C.NetWorthHistoryQuery,signal?:AbortSignal) => transport.request(base+'/net-worth/history'+query(C.NetWorthHistoryQuerySchema.parse(filters)),C.NetWorthHistorySchema,'GET',undefined,signal),
    netWorthItems: (filters:C.NetWorthItemQuery={},signal?:AbortSignal) => transport.request(base+'/net-worth/items'+query(C.NetWorthItemQuerySchema.parse(filters)),C.NetWorthItemsPageSchema,'GET',undefined,signal),
    netWorthItem: (id:string,signal?:AbortSignal) => transport.request(base+'/net-worth/items/'+z.uuid().parse(id),C.NetWorthItemSchema,'GET',undefined,signal),
    createNetWorthItem: (input:C.NetWorthItemInput) => transport.request(base+'/net-worth/items',C.NetWorthItemSchema,'POST',C.NetWorthItemInputSchema.parse(input)),
    patchNetWorthItem: (id:string,input:C.NetWorthItemPatch) => transport.request(base+'/net-worth/items/'+z.uuid().parse(id),C.NetWorthItemSchema,'PATCH',C.NetWorthItemPatchSchema.parse(input)),
    archiveNetWorthItem: (id:string) => transport.request(base+'/net-worth/items/'+z.uuid().parse(id)+'/archive',C.NetWorthItemSchema,'POST',{}),
    netWorthValuations: (id:string,filters:C.NetWorthValuationQuery={},signal?:AbortSignal) => transport.request(base+'/net-worth/items/'+z.uuid().parse(id)+'/valuations'+query(C.NetWorthValuationQuerySchema.parse(filters)),C.NetWorthValuationsPageSchema,'GET',undefined,signal),
    addNetWorthValuation: (id:string,input:C.NetWorthValuationInput) => transport.request(base+'/net-worth/items/'+z.uuid().parse(id)+'/valuations',C.NetWorthValuationSchema,'POST',C.NetWorthValuationInputSchema.parse(input)),
    recurrences: (filters:C.RecurrenceQuery,signal?:AbortSignal) => transport.request(base+'/recurrences'+query(C.RecurrenceQuerySchema.parse(filters)),C.RecurrencePageSchema,'GET',undefined,signal),
    recurrence: (id:string,signal?:AbortSignal) => transport.request(base+'/recurrences/'+z.uuid().parse(id),C.RecurrenceSchema,'GET',undefined,signal),
    createRecurrence: (input:C.RecurrenceInput) => transport.request(base+'/recurrences',C.RecurrenceSchema,'POST',C.RecurrenceInputSchema.parse(input)),
    patchRecurrence: (id:string,input:C.RecurrencePatch) => transport.request(base+'/recurrences/'+z.uuid().parse(id),C.RecurrenceSchema,'PATCH',C.RecurrencePatchSchema.parse(input)),
    recurrenceStatus: (id:string,action:'pause'|'resume'|'archive') => transport.request(base+'/recurrences/'+z.uuid().parse(id)+'/'+action,C.RecurrenceSchema,'POST',C.RecurrenceEmptyBodySchema.parse({})),
    calendar: (filters:C.CalendarQuery,signal?:AbortSignal) => transport.request(base+'/calendar'+query(C.CalendarQuerySchema.parse(filters)),C.FinancialCalendarSchema,'GET',undefined,signal),
    subscriptionRadar: (filters:C.RadarQuery,signal?:AbortSignal) => transport.request(base+'/subscriptions/radar'+query(C.RadarQuerySchema.parse(filters)),C.SubscriptionRadarSchema,'GET',undefined,signal),
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
