import { logoutThroughAccount } from './navigation-helper';
import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';
import type { Goal, GoalEvent } from '../../src/features/finance/contracts.generated';
import { goalFixture } from '../fixtures/goals';
const owner = '11111111-1111-4111-8111-111111111111';
const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'test@example.test', created_at: '2026-01-01T00:00:00Z', app_metadata: {}, user_metadata: {} };
const token = [Buffer.from('{"alg":"ES256","kid":"synthetic"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'), 'synthetic-signature'].join('.');
const session = { access_token: token, refresh_token: 'synthetic-refresh', expires_in: 3600, token_type: 'bearer', user };
async function boundary(page: Page, initial: Goal[] = [], options = { fail: false, slow: false, uncertain: false }) {
  const state = { goals: initial, events: [] as GoalEvent[], writes: [] as { path: string; body: Record<string, unknown> }[], reads: [] as string[], uncertainSent: false };
  const headers = { 'access-control-allow-origin': 'http://localhost:3103', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS' };
  await page.route('**/auth/v1/**', route => route.request().method() === 'OPTIONS' ? route.fulfill({ status: 204, headers }) : route.fulfill({ status: 200, headers, json: new URL(route.request().url()).pathname.endsWith('/token') ? session : user }));
  await page.route('**/api/v1/**', async route => {
    const req = route.request(), url = new URL(req.url()), method = req.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(req.headers().authorization).toBe('Bearer ' + token);
    const reply = (json: unknown, status = 200) => route.fulfill({ headers, json, status });
    if (url.pathname.endsWith('/me')) return reply({ identity: { authUserId: owner }, profile: { id: owner, displayName: 'Conta Teste', locale: 'pt-BR', timezone: 'America/Sao_Paulo', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' } });
    expect(url.pathname).toMatch(/^\/api\/v1\/finance\/goals/);
    const id = url.pathname.split('/')[5];
    const goal = state.goals.find(g => g.id === id);
    if (method === 'GET') {
      state.reads.push(url.pathname + url.search);
      if (options.slow) await new Promise(r => setTimeout(r, 500));
      if (options.fail) return reply({}, 503);
      if (!id) return reply(state.goals.filter(g => (!url.searchParams.get('status') || g.status === url.searchParams.get('status')) && (!url.searchParams.get('currency') || g.currency === url.searchParams.get('currency'))));
      if (!goal) return reply({}, 404);
      return reply(url.pathname.endsWith('/events') ? { items: state.events.filter(e => e.goalId === id), nextCursor: null } : goal);
    }
    const body = req.postDataJSON() as Record<string, unknown>;
    expect(body).not.toHaveProperty('auth_user_id'); expect(body).not.toHaveProperty('currentAmountMinor');
    state.writes.push({ path: url.pathname, body });
    if (!id && method === 'POST') { const created = goalFixture({ ...body, id: randomUUID() } as Partial<Goal>); state.goals.push(created); return reply(created, 201); }
    if (!goal) return reply({}, 404);
    if (method === 'PATCH') { Object.assign(goal, body, { archivedAt: body.status === 'ARCHIVED' ? '2026-10-02T12:00:00Z' : goal.archivedAt }); if (body.targetAmountMinor === '1200000') { goal.remainingAmountMinor = '1000000'; goal.progressPercent = '16.66'; } return reply(goal); }
    expect(body).not.toHaveProperty('currency');
    const existing = state.events.find(e => e.idempotencyKey === body.idempotencyKey);
    if (existing) return reply(existing, 201);
    if (goal.status !== 'ACTIVE') return reply({}, 409);
    const event = { ...body, id: randomUUID(), goalId: goal.id, currency: goal.currency, createdAt: '2026-10-02T12:00:00Z' } as GoalEvent;
    state.events.push(event);
    if (body.type === 'CONTRIBUTION') Object.assign(goal, { currentAmountMinor: '250000', remainingAmountMinor: '750000', progressPercent: '25.00', requiredMonthlyMinor: '250000', estimatedCompletionMonth: '2027-05' });
    else Object.assign(goal, { currentAmountMinor: '200000', remainingAmountMinor: '800000', progressPercent: '20.00' });
    if (options.uncertain && !state.uncertainSent) { state.uncertainSent = true; return reply({}, 503); }
    return reply(event, 201);
  });
  return state;
}
async function login(page: Page, path = '/finance/goals') { await page.goto('/login'); await page.getByLabel('E-mail').fill('test@example.test'); await page.getByLabel('Senha', { exact: true }).fill('synthetic-password'); await page.getByRole('button', { name: 'Entrar na minha conta' }).click(); await expect(page.getByRole('heading', { name: 'Bom ter você aqui, Conta Teste.' })).toBeVisible(); await page.goto(path); }
test('empty → create → contribution → reload → withdrawal → edit → pause/resume → archive preserves history', async ({ page }) => {
  const state = await boundary(page); await login(page);
  await expect(page.getByRole('heading', { name: 'Crie sua primeira meta financeira' })).toBeVisible();
  await expect(page.getByText(/não movimenta suas contas/)).toBeVisible(); await page.getByRole('button', { name: 'Nova meta' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Reserva teste'); await page.getByLabel('Valor alvo', { exact: true }).fill('10000'); await page.getByLabel('Prazo opcional').fill('2026-12'); await page.getByLabel('Contribuição mensal planejada opcional').fill('1000'); await page.getByLabel('Prioridade').selectOption('HIGH'); await page.getByRole('button', { name: 'Criar meta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reserva teste', exact: true })).toBeVisible(); await expect(page.getByText('0% do valor alvo')).toBeVisible(); expect(state.writes[0]!.body).toMatchObject({ targetAmountMinor: '1000000', plannedMonthlyMinor: '100000', currency: 'BRL' });
  await page.getByRole('button', { name: 'Adicionar valor', exact: true }).click(); await page.getByLabel('Valor em BRL').fill('2500'); await page.getByRole('button', { name: 'Registrar contribuição' }).click(); await expect(page.getByText('25% do valor alvo')).toBeVisible();
  await page.reload(); await expect(page.getByText('25% do valor alvo')).toBeVisible(); await expect(page.getByRole('heading', { name: 'Histórico da meta' })).toBeVisible();
  await page.getByRole('button', { name: 'Retirar valor', exact: true }).click(); await page.getByLabel('Valor em BRL').fill('500'); await page.getByRole('button', { name: 'Registrar retirada' }).click(); await expect(page.getByText('20% do valor alvo')).toBeVisible();
  await page.getByRole('button', { name: 'Editar meta', exact: true }).click(); await expect(page.getByLabel('Moeda', { exact: true })).toBeDisabled(); await page.getByLabel('Valor alvo', { exact: true }).fill('12000'); await page.getByRole('button', { name: 'Salvar meta' }).click(); await expect(page.getByText('16,66% do valor alvo')).toBeVisible();
  await page.getByRole('button', { name: 'Pausar meta' }).click(); await expect(page.getByRole('button', { name: 'Retomar meta' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Adicionar valor', exact: true })).toHaveCount(0); await page.getByRole('button', { name: 'Retomar meta' }).click(); await expect(page.getByRole('button', { name: 'Adicionar valor', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arquivar meta' }).click(); await page.getByRole('alertdialog', { name: 'Arquivar meta' }).getByRole('button', { name: 'Confirmar arquivamento' }).click(); await expect(page.getByText(/Meta arquivada/)).toBeVisible(); await expect(page.getByText('Contribuição', { exact: true })).toBeVisible(); await expect(page.getByText('Retirada', { exact: true })).toBeVisible(); await page.getByRole('link', { name: 'Todas as metas' }).click(); await page.getByLabel('Status', { exact: true }).selectOption('ARCHIVED'); await expect(page.getByRole('link', { name: 'Reserva teste' })).toBeVisible();
  expect(state.events).toHaveLength(2); expect(state.writes.every(w => w.path.startsWith('/api/v1/finance/goals'))).toBe(true);
});
test('all deterministic plan labels and per-currency totals remain readable', async ({ page }) => { const statuses: Goal['planStatus'][] = ['ACHIEVED', 'ON_TRACK', 'ATTENTION', 'OVERDUE', 'NO_PLAN']; await boundary(page, statuses.map((planStatus, i) => goalFixture({ id: randomUUID(), name: 'Meta ' + i, planStatus, currency: i === 1 ? 'USD' : 'BRL', ...(i === 0 ? { currentAmountMinor: '1200000', remainingAmountMinor: '0', progressPercent: '120.00' } : {}), ...(i === 4 ? { plannedMonthlyMinor: null, requiredMonthlyMinor: null, estimatedCompletionMonth: null } : {}) }))); await login(page); for (const label of ['Meta atingida', 'No caminho', 'Requer atenção', 'Prazo vencido', 'Sem plano suficiente']) await expect(page.getByText(label, { exact: true })).toBeVisible(); await expect(page.getByText('120% do valor alvo')).toBeVisible(); await expect(page.getByRole('progressbar', { name: 'Progresso de Meta 0' })).toHaveAttribute('aria-valuenow', '100'); await expect(page.getByText('BRL · METAS EXIBIDAS')).toBeVisible(); await expect(page.getByText('USD · METAS EXIBIDAS')).toBeVisible(); await page.getByLabel('Filtrar moeda').selectOption('USD'); await expect(page.getByRole('link', { name: 'Meta 1' })).toBeVisible(); await expect(page.getByRole('link', { name: 'Meta 0' })).toHaveCount(0); });
test('reuses the same idempotency key after a committed request with uncertain response', async ({ page }) => { const g = goalFixture(); const state = await boundary(page, [g], { fail: false, slow: false, uncertain: true }); await login(page, '/finance/goals/' + g.id); await page.getByRole('button', { name: 'Adicionar valor', exact: true }).click(); await page.getByLabel('Valor em BRL').fill('2500'); await page.getByRole('button', { name: 'Registrar contribuição' }).click(); await expect(page.getByText('Não foi possível concluir a solicitação. Tente novamente.')).toBeVisible(); await page.getByRole('button', { name: 'Registrar contribuição' }).click(); await expect(page.getByText('25% do valor alvo')).toBeVisible(); expect(state.events).toHaveLength(1); expect(state.writes[0]!.body).toEqual(state.writes[1]!.body); });
test('invalid target and overdraft never issue a write', async ({ page }) => { const g = goalFixture({ currentAmountMinor: '100' }); const state = await boundary(page, [g]); await login(page, '/finance/goals/' + g.id); await page.getByRole('button', { name: 'Retirar valor', exact: true }).click(); await page.getByLabel('Valor em BRL').fill('10'); await page.getByRole('button', { name: 'Registrar retirada' }).click(); await expect(page.getByText(/retirada não pode superar/)).toBeVisible(); await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); await page.getByRole('button', { name: 'Editar meta', exact: true }).click(); await page.getByLabel('Valor alvo', { exact: true }).fill('-1'); await page.getByRole('button', { name: 'Salvar meta' }).click(); await expect(page.getByRole('alert')).toBeVisible(); expect(state.writes).toHaveLength(0); });
test('loading and service failures never display invented success', async ({ page }) => { await boundary(page, [], { fail: true, slow: true, uncertain: false }); await login(page); await expect(page.getByRole('status')).toContainText('Carregando metas'); await expect(page.getByRole('alert')).toContainText('Não foi possível carregar suas metas'); });
test('foreign/unknown goal is unavailable and logout removes goal UI', async ({ page }) => { const g = goalFixture(); await boundary(page, [g]); await login(page, '/finance/goals/' + randomUUID()); await expect(page.getByRole('alert')).toContainText('Este registro não está disponível para sua conta'); await page.goto('/finance/goals/' + g.id); await expect(page.getByRole('heading', { name: g.name })).toBeVisible(); await logoutThroughAccount(page); await expect(page).toHaveURL(/\/login$/); await page.goto('/finance/goals/' + g.id); await expect(page).toHaveURL(/\/login$/); });
test('tablet layout and keyboard navigation preserve readable goal details', async ({ page }, testInfo) => { await page.setViewportSize({ width: 820, height: 1180 }); await boundary(page, [goalFixture()]); await login(page); await expect(page.getByRole('link', { name: 'Reserva teste' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); await page.getByRole('link', { name: 'Reserva teste' }).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { name: 'Reserva teste' })).toBeVisible(); await page.screenshot({ path: '.harness/tmp/goals-tablet-' + testInfo.project.name + '.png', fullPage: true }); });
test('desktop/mobile goal layout has no horizontal overflow', async ({ page }, testInfo) => { await boundary(page, [goalFixture()]); await login(page); await expect(page.getByRole('link', { name: 'Reserva teste' })).toBeVisible(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); await page.screenshot({ path: '.harness/tmp/goals-' + testInfo.project.name + '.png', fullPage: true }); });
