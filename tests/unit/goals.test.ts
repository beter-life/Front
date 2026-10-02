import { describe, it, expect } from 'vitest';
import { goalTotals } from '../../src/features/finance/goal-view';
import { GoalInputSchema, GoalPatchSchema, GoalEventInputSchema } from '../../src/features/finance/contracts.generated';
import { budgetPercentLabel, budgetProgress } from '../../src/features/finance/budget-view';
import { goalFixture } from '../fixtures/goals';
describe('goal presentation and boundary', () => {
  it('groups exact totals by currency without converting or losing integer precision', () => { const rows = goalTotals([goalFixture({ currentAmountMinor: '9007199254740993', remainingAmountMinor: '0' }), goalFixture({ currentAmountMinor: '1' }), goalFixture({ currency: 'USD', currentAmountMinor: '2' })]); expect(rows).toMatchObject([{ currency: 'BRL', current: 9007199254740994n }, { currency: 'USD', current: 2n }]); });
  it('caps only visual progress and preserves >100% text', () => { expect(budgetProgress('120.00')).toBe(100); expect(budgetPercentLabel('120.00')).toBe('120%'); expect(budgetPercentLabel('16.66')).toBe('16,66%'); });
  it('rejects client ownership and derived fields and keeps currency immutable', () => { expect(GoalInputSchema.safeParse({ name: 'Goal', currency: 'BRL', targetAmountMinor: '1', priority: 'HIGH', auth_user_id: 'foreign' }).success).toBe(false); expect(GoalPatchSchema.safeParse({ currency: 'USD' }).success).toBe(false); expect(GoalPatchSchema.safeParse({}).success).toBe(false); expect(GoalPatchSchema.safeParse({ currentAmountMinor: '100' }).success).toBe(false); });
  it('allows nullable planning fields and blocks event currency/owner', () => { expect(GoalInputSchema.parse({ name: 'Goal', currency: 'BRL', targetAmountMinor: '1', priority: 'MEDIUM', targetMonth: null, plannedMonthlyMinor: '0' })).toMatchObject({ plannedMonthlyMinor: '0' }); const input = { type: 'CONTRIBUTION', amountMinor: '1', occurredAt: '2026-10-01T12:00:00Z', idempotencyKey: goalFixture().id }; expect(GoalEventInputSchema.safeParse({ ...input, currency: 'USD' }).success).toBe(false); expect(GoalEventInputSchema.safeParse({ ...input, auth_user_id: 'foreign' }).success).toBe(false); });
});
