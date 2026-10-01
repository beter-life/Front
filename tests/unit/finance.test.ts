import { describe, expect, it, vi } from 'vitest';
import { formatMoney, parseMoney } from '../../src/features/finance/money';
import { displayDate, localDateTime, toInstant } from '../../src/features/finance/dates';
import { createFinanceApi } from '../../src/features/finance/api';
import { createApiClient } from '../../src/api/client';
import {
  AccountInputSchema,
  AccountPatchSchema,
  TransactionInputSchema,
} from '../../src/features/finance/contracts.generated';
describe('finance exact money and timezone', () => {
  it('parses zero/two/three decimal units without float rounding', () => {
    expect(parseMoney('10,50', 'BRL')).toBe('1050');
    expect(parseMoney('10', 'JPY')).toBe('10');
    expect(parseMoney('1.234', 'KWD')).toBe('1234');
    expect(parseMoney('90071992547409,93', 'BRL')).toBe('9007199254740993');
    for (const value of ['0', '-1', '1.234', '1.000,50', 'Infinity'])
      expect(() => parseMoney(value, 'BRL')).toThrow();
    expect(() => parseMoney('1,1', 'JPY')).toThrow();
    expect(() => parseMoney('92233720368547758,08', 'BRL')).toThrow();
    expect(parseMoney('-0,50', 'BRL', false)).toBe('-50');
  });
  it('formats exact fractional and huge values, including negative subunits', () => {
    expect(formatMoney('1050', 'BRL')).toContain('10,50');
    expect(formatMoney('-50', 'BRL')).toContain('-R$');
    expect(formatMoney('-50', 'BRL')).toContain('0,50');
    expect(formatMoney('9007199254740993', 'BRL')).toContain('90.071.992.547.409,93');
    expect(formatMoney('100', 'JPY')).not.toContain(',00');
    expect(formatMoney('1234', 'KWD')).toContain('1,234');
  });
  it('uses the profile timezone, validates DST gaps and round-trips occurrences', () => {
    expect(toInstant('2026-01-15T09:00', 'America/Sao_Paulo')).toBe('2026-01-15T12:00:00.000Z');
    expect(localDateTime('2026-01-15T12:00:00Z', 'America/Sao_Paulo')).toBe('2026-01-15T09:00');
    expect(displayDate('2026-01-15T12:00:00Z', 'America/Sao_Paulo')).toContain('09:00');
    expect(() => toInstant('2026-03-08T02:30', 'America/New_York')).toThrow();
    expect(() => toInstant('invalid', 'UTC')).toThrow();
    expect(() => toInstant('2026-02-30T12:00', 'UTC')).toThrow();
  });
});
describe('finance generated contracts and transport', () => {
  it('rejects ownership, arbitrary balance updates and invalid request fields', () => {
    expect(
      AccountInputSchema.safeParse({
        name: 'x',
        type: 'checking',
        currency: 'ZZZ',
        initialBalanceMinor: '0',
      }).success,
    ).toBe(false);
    expect(AccountPatchSchema.safeParse({ balanceMinor: '50' }).success).toBe(false);
    expect(AccountPatchSchema.safeParse({}).success).toBe(false);
    expect(
      TransactionInputSchema.safeParse({ authUserId: '11111111-1111-4111-8111-111111111111' })
        .success,
    ).toBe(false);
  });
  it('uses current authenticated transport and encoded bounded filters', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{"items":[],"nextCursor":null}'));
    const finance = createFinanceApi(
      createApiClient('https://api.example.test', () => 'synthetic-access', vi.fn(), fetcher),
    );
    expect(await finance.transactions({ type: 'INCOME', limit: '25' })).toEqual({
      items: [],
      nextCursor: null,
    });
    const sent = new URL(String(fetcher.mock.calls[0]?.[0]));
    expect(sent.pathname).toBe('/api/v1/finance/transactions');
    expect(Object.fromEntries(sent.searchParams)).toEqual({ limit: '25', type: 'INCOME' });
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({
      authorization: 'Bearer synthetic-access',
    });
    fetcher.mockResolvedValueOnce(new Response('{}', { status: 409 }));
    await expect(finance.accounts()).rejects.toMatchObject({ status: 409 });
  });
});
