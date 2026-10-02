import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type {
  BudgetSummary,
  BudgetAllocation,
} from '../../src/features/finance/contracts.generated';
import {
  allocation,
  budgetSummary,
  category,
  emptyBudget,
  metadata,
  period,
} from '../fixtures/budgets';

const owner = '11111111-1111-4111-8111-111111111111';
const user = {
  id: owner,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.test',
  created_at: metadata.createdAt,
  app_metadata: {},
  user_metadata: {},
};
const token = [
  Buffer.from('{"alg":"ES256","kid":"synthetic"}').toString('base64url'),
  Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString(
    'base64url',
  ),
  'synthetic-signature',
].join('.');
const session = {
  access_token: token,
  refresh_token: 'synthetic-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user,
};
async function boundary(page: Page, initial = emptyBudget(), failure = false, slow = false) {
  const state = {
    summary: initial,
    writes: [] as { method: string; month: string; body: Record<string, unknown> }[],
    reads: [] as string[],
  };
  const headers = {
    'access-control-allow-origin': 'http://localhost:3103',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  };
  await page.route('**/auth/v1/**', (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({
      status: 200,
      json: path.endsWith('/token') ? session : path.endsWith('/user') ? user : {},
      headers,
    });
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.headers().authorization).toBe(`Bearer ${token}`);
    const reply = (json: unknown, status = 200) => route.fulfill({ status, json, headers });
    if (url.pathname.endsWith('/me'))
      return reply({
        identity: { authUserId: owner },
        profile: {
          ...metadata,
          id: '33333333-3333-4333-8333-333333333333',
          displayName: 'Conta Teste',
          locale: 'pt-BR',
          timezone: 'America/Sao_Paulo',
        },
      });
    if (url.pathname.endsWith('/categories'))
      return reply([
        category,
        {
          ...category,
          id: '77777777-7777-4777-8777-777777777777',
          name: 'Salário',
          kind: 'INCOME',
        },
        {
          ...category,
          id: '88888888-8888-4888-8888-888888888888',
          name: 'Inativa',
          isActive: false,
        },
      ]);
    const month = url.pathname.split('/')[5]!;
    if (method === 'GET') {
      state.reads.push(url.pathname + url.search);
      if (slow) await new Promise((resolve) => setTimeout(resolve, 450));
      if (failure) return reply({}, 503);
      return reply({ ...state.summary, month, currency: url.searchParams.get('currency') });
    }
    const body = method === 'DELETE' ? {} : request.postDataJSON();
    state.writes.push({ method, month, body });
    if (method === 'PUT') {
      state.summary = emptyBudget({ periodId: period.id });
      return reply({ ...period, month });
    }
    if (method === 'PATCH') {
      expect(body).toMatchObject({ currency: 'BRL' });
      const saved: BudgetAllocation = { ...allocation, ...body };
      state.summary =
        body.amountMinor === '60000'
          ? budgetSummary({
              categories: [
                {
                  ...budgetSummary().categories[0]!,
                  baseMinor: '60000',
                  availableMinor: '60000',
                  remainingMinor: '50000',
                  utilizationPercent: '16.66',
                },
              ],
              baseBudgetTotalMinor: '60000',
              budgetedTotalMinor: '60000',
              remainingBudgetedMinor: '50000',
              utilizationPercent: '16.66',
            })
          : budgetSummary();
      return reply(saved);
    }
    if (method === 'POST') {
      state.summary = budgetSummary({ canCopyPrevious: true });
      return reply({
        period: { ...period, month },
        copiedCount: 1,
        alreadyPresentCount: 0,
        skippedInactiveCount: 0,
      });
    }
    if (method === 'DELETE') {
      state.summary = emptyBudget({
        periodId: period.id,
        expenseTotalMinor: '10000',
        unbudgetedSpendingMinor: '10000',
        unbudgetedCategories: [
          {
            categoryId: category.id,
            categoryName: category.name,
            categoryIsActive: true,
            spentMinor: '10000',
          },
        ],
      });
      return reply({ ...allocation, isActive: false });
    }
    return reply({}, 404);
  });
  return state;
}
async function loginBudget(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Bom ter você aqui, Conta Teste.' }),
  ).toBeVisible();
  await page.goto('/finance/budgets?month=2026-10&currency=BRL');
}
test('budget empty/create, 500/100/400/20%, edit, reload, removal and navigation', async ({
  page,
}) => {
  const state = await boundary(page);
  await loginBudget(page);
  await expect(page.getByText('Seu orçamento começa aqui.')).toBeVisible();
  await page.getByRole('button', { name: 'Criar orçamento deste mês' }).click();
  await page.getByRole('button', { name: 'Adicionar categoria' }).click();
  await expect(
    page.getByLabel('Categoria de despesa').getByRole('option', { name: 'Salário' }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel('Categoria de despesa').getByRole('option', { name: 'Inativa' }),
  ).toHaveCount(0);
  await page.getByLabel('Categoria de despesa').selectOption(category.id);
  await page.getByLabel('Limite planejado').fill('500,00');
  await page.getByRole('button', { name: 'Adicionar limite' }).click();
  const card = page.locator('.budget-category');
  await expect(card).toContainText('500,00');
  await expect(card).toContainText('100,00');
  await expect(card).toContainText('400,00');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '20%');
  await page.getByRole('button', { name: 'Editar limite' }).click();
  await page.getByLabel('Limite planejado').fill('600,00');
  await page.getByRole('button', { name: 'Salvar limite' }).click();
  await expect(card).toContainText('500,00');
  await expect(card.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '16,66%');
  await page.reload();
  await expect(card).toContainText('600,00');
  await page.getByRole('button', { name: 'Remover limite' }).click();
  await expect(page.getByText('Remover este limite?', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar remoção' }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('.budget-unplanned')).toContainText('Alimentação');
  await page.getByRole('button', { name: 'Próximo mês' }).click();
  await expect(page.getByLabel('Mês do orçamento')).toHaveValue('2026-11');
  await expect.poll(() => state.reads.at(-1)).toContain('/budgets/2026-11/summary?currency=BRL');
  await page.getByLabel('Moeda do orçamento').selectOption('JPY');
  await expect.poll(() => state.reads.at(-1)).toContain('currency=JPY');
  expect(state.writes.map((w) => w.method)).toEqual(['PUT', 'PATCH', 'PATCH', 'DELETE']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('copy previous and positive rollover never hide uncategorized/unbudgeted spending', async ({
  page,
}) => {
  const s = budgetSummary({
    canCopyPrevious: true,
    categories: [
      {
        ...budgetSummary().categories[0]!,
        rolloverPolicy: 'POSITIVE_ONLY',
        rolloverMinor: '8000',
        availableMinor: '58000',
        remainingMinor: '48000',
      },
    ],
    rolloverTotalMinor: '8000',
    budgetedTotalMinor: '58000',
    unbudgetedSpendingMinor: '15000',
    unbudgetedCategories: [
      { categoryId: null, categoryName: null, categoryIsActive: false, spentMinor: '15000' },
    ],
  });
  const state = await boundary(page, s);
  await loginBudget(page);
  await expect(page.getByText(/Sobra positiva:.*80,00.*Disponível:.*580,00/)).toBeVisible();
  await expect(page.locator('.budget-unplanned')).toContainText('Sem categoria');
  await expect(page.locator('.budget-unplanned')).toContainText('150,00');
  await page.getByRole('button', { name: 'Copiar mês anterior' }).click();
  await expect(
    page.getByText(
      '1 limites copiados. 0 existentes preservados. 0 categorias inativas ignoradas.',
    ),
  ).toBeVisible();
  expect(state.writes.filter((w) => w.method === 'POST')).toHaveLength(1);
});
test('pace has readable on-track, attention, over-budget and zero-limit states', async ({
  page,
}) => {
  const state = await boundary(page, budgetSummary());
  await loginBudget(page);
  await expect(page.getByText('Dentro do ritmo').first()).toBeVisible();
  const cases: [BudgetSummary['paceStatus'], string][] = [
    ['ATTENTION', 'Acima do ritmo'],
    ['OVER_BUDGET', 'Acima do orçamento'],
  ];
  for (const [paceStatus, text] of cases) {
    state.summary = budgetSummary({
      paceStatus,
      categories: [{ ...budgetSummary().categories[0]!, paceStatus, utilizationPercent: '140.00' }],
    });
    await page.reload();
    await expect(page.getByText(text).first()).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  }
  state.summary = budgetSummary({
    utilizationPercent: null,
    categories: [
      {
        ...budgetSummary().categories[0]!,
        baseMinor: '0',
        availableMinor: '0',
        remainingMinor: '-10000',
        utilizationPercent: null,
        paceStatus: 'OVER_BUDGET',
      },
    ],
  });
  await page.reload();
  await expect(page.getByText('Sem limite disponível').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('tablet layout remains readable and budget navigation works by keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 834, height: 1112 });
  await boundary(page, budgetSummary());
  await loginBudget(page);
  await expect(page.getByRole('heading', { name: 'Alimentação' })).toBeVisible();
  const next = page.getByRole('button', { name: 'Próximo mês' });
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Mês do orçamento')).toHaveValue('2026-11');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('loading and API failures are accessible; logout revokes budget access', async ({ page }) => {
  await boundary(page, emptyBudget(), true, true);
  await loginBudget(page);
  await expect(page.getByRole('status')).toBeVisible();
  await expect(
    page.getByText('Não foi possível concluir a solicitação. Tente novamente.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await page.goto('/finance/budgets');
  await expect(page).toHaveURL('http://localhost:3103/login');
});
