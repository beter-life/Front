import { expect, type Page } from '@playwright/test';
import { bankAccount, cardAccount, cardFixture, cardViewFixture, cardPurchase, expenseCategory, cardsSummaryFixture } from '../fixtures/cards';
import { debtFixture, debtViewFixture, debtSummaryFixture } from '../fixtures/debts';
import { goalFixture } from '../fixtures/goals';
import { budgetSummary, allocation, period } from '../fixtures/budgets';
import { calendarFixture, entryFixture, radarFixture, recurrenceFixture } from '../fixtures/recurrences';
import { netWorthSummary, netWorthHistory, netWorthItem } from '../fixtures/net-worth';
import { yieldAccount, yieldBenchmarks, yieldProfile, yieldSummary, yieldEstimate } from '../fixtures/yield';
import { safeSettings, safeView } from '../fixtures/safe-spend';

export async function uiuxBoundary(page: Page, options: { movements?: boolean } = {}) {
  const owner = '11111111-1111-4111-8111-111111111111', instant = '2026-01-01T00:00:00Z';
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'test@example.test', created_at: instant, app_metadata: {}, user_metadata: {} };
  const token = [Buffer.from('{"alg":"ES256","kid":"synthetic"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url'), 'synthetic-signature'].join('.');
  const session = { access_token: token, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600, user };
  const state = { financialWrites: 0, logouts: 0, errors: [] as string[] };
  page.on('pageerror', error => state.errors.push(error.name));
  await page.route('**/auth/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    const headers = { 'access-control-allow-origin': route.request().headers().origin ?? '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (path.endsWith('/logout')) state.logouts++;
    return route.fulfill({ headers, json: path.endsWith('/token') ? session : path.endsWith('/logout') ? {} : user });
  });
  await page.route('**/api/v1/**', route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    const headers = { 'access-control-allow-origin': request.headers().origin ?? '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.headers().authorization).toBe('Bearer ' + token);
    const reply = (json: unknown) => route.fulfill({ headers, json });
    if (request.method() !== 'GET') { state.financialWrites++; return route.fulfill({ status: 503, headers, json: {} }); }
    if (path.endsWith('/me')) return reply({ identity: { authUserId: owner }, profile: { id: owner, displayName: 'Conta Teste', locale: 'pt-BR', timezone: 'America/Sao_Paulo', createdAt: instant, updatedAt: instant } });
    if (path.endsWith('/accounts')) return reply([bankAccount, cardAccount, yieldAccount]);
    if (path.endsWith('/categories')) return reply([expenseCategory]);
    if (path.includes('/safe-to-spend')) return reply(path.endsWith('/settings') ? safeSettings : safeView);
    if (path.includes('/cards')) {
      if (path.endsWith('/summary')) return reply(cardsSummaryFixture);
      if (path.endsWith('/purchases')) return reply({ items: [cardPurchase], nextCursor: null });
      return reply(path.endsWith('/cards') ? [cardFixture] : cardViewFixture());
    }
    if (path.includes('/debts')) {
      if (path.endsWith('/summary')) return reply(debtSummaryFixture);
      if (path.endsWith('/payments')) return reply({ items: [], nextCursor: null });
      return reply(path.endsWith('/debts') ? [debtFixture] : debtViewFixture());
    }
    if (path.includes('/goals')) return reply(path.endsWith('/events') ? { items: [], nextCursor: null } : path.endsWith('/goals') ? [goalFixture()] : goalFixture());
    if (path.includes('/budgets')) return reply(path.endsWith('/summary') ? budgetSummary({ month: path.split('/')[5]!, currency: 'BRL' }) : { period, allocations: [allocation] });
    if (path.endsWith('/recurrences')) return reply({ items: [recurrenceFixture()], nextCursor: null });
    if (path.endsWith('/calendar')) return reply(calendarFixture([entryFixture()], url.searchParams.get('from')!, url.searchParams.get('to')!));
    if (path.endsWith('/radar')) return reply(radarFixture([recurrenceFixture()], [entryFixture()]));
    if (path.includes('/net-worth')) return reply(path.endsWith('/history') ? netWorthHistory : path.endsWith('/items') ? { items: [netWorthItem()], nextCursor: null } : netWorthSummary);
    if (path.endsWith('/benchmarks')) return reply(yieldBenchmarks);
    if (path.endsWith('/profiles')) return reply([yieldProfile()]);
    if (path.endsWith('/yield-profile')) return reply(yieldProfile());
    if (path.endsWith('/estimate')) return reply(yieldEstimate);
    if (path.endsWith('/yield/summary')) return reply(yieldSummary);
    if (path.endsWith('/transactions')) return reply({ items: options.movements ? ['INCOME', 'EXPENSE', 'TRANSFER'].map((type, index) => ({
      id: `55555555-5555-4555-8555-55555555555${index}`, createdAt: instant, updatedAt: instant,
      accountId: bankAccount.id, destinationAccountId: type === 'TRANSFER' ? cardAccount.id : null,
      categoryId: type === 'EXPENSE' ? expenseCategory.id : null, type, currency: 'BRL',
      amountMinor: ['350000', '12990', '33333'][index], description: ['Receita teste', 'Despesa teste', 'Pagamento teste'][index],
      occurredAt: '2026-10-08T12:00:00Z', isCancelled: false,
    })) : [], nextCursor: null });
    if (path.endsWith('/summary')) return reply({ from: url.searchParams.get('from'), to: url.searchParams.get('to'), currencies: [{ currency: 'BRL', totalBalanceMinor: '1000000', incomeMinor: '30000', expenseMinor: '10000', netMinor: '20000' }] });
    throw new Error('Unexpected UI fixture endpoint: ' + path);
  });
  return state;
}
export async function uiuxLogin(page: Page, origin = '') {
  await page.goto(origin + '/login'); await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui, Conta Teste.' })).toBeVisible();
}
