import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import type {
  Account,
  Category,
  Transaction,
  Transfer,
} from '../../src/features/finance/contracts.generated';
const owner = '11111111-1111-4111-8111-111111111111';
const now = '2026-01-01T00:00:00Z';
const user = {
  id: owner,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'test@example.test',
  created_at: now,
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
async function boundary(page: Page, options: { accountFailure?: boolean; slow?: boolean } = {}) {
  const accounts: Account[] = [];
  const categories: Category[] = [];
  const movements: Transaction[] = [];
  const state = {
    accountWrites: 0,
    transactionWrites: 0,
    transferWrites: 0,
    filters: [] as string[],
    logins: 0,
  };
  const headers = {
    'access-control-allow-origin': 'http://localhost:3103',
    'access-control-allow-headers': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,OPTIONS',
  };
  const metadata = () => ({ id: crypto.randomUUID(), createdAt: now, updatedAt: now });
  function balance(account: Account) {
    return String(
      movements
        .filter((row) => !row.isCancelled)
        .reduce(
          (total, row) =>
            total +
            (row.accountId === account.id
              ? BigInt(row.amountMinor) * (row.type === 'INCOME' ? 1n : -1n)
              : row.destinationAccountId === account.id
                ? BigInt(row.amountMinor)
                : 0n),
          BigInt(account.initialBalanceMinor),
        ),
    );
  }
  await page.route('**/auth/v1/**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/token')) {
      state.logins++;
      return route.fulfill({ status: 200, json: session, headers });
    }
    if (path.endsWith('/user')) return route.fulfill({ status: 200, json: user, headers });
    return route.fulfill({ status: 200, json: {}, headers });
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.headers().authorization).toBe(`Bearer ${token}`);
    const reply = (json: unknown, status = 200) => route.fulfill({ status, json, headers });
    if (url.pathname === '/api/v1/me')
      return reply({
        identity: { authUserId: owner },
        profile: {
          id: '33333333-3333-4333-8333-333333333333',
          displayName: 'Conta Teste',
          locale: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          createdAt: now,
          updatedAt: now,
        },
      });
    if (options.slow) await new Promise((resolve) => setTimeout(resolve, 350));
    if (url.pathname.endsWith('/accounts')) {
      if (request.method() === 'POST') {
        state.accountWrites++;
        if (options.accountFailure) return reply({}, 503);
        const body = request.postDataJSON();
        expect(body.authUserId).toBeUndefined();
        expect(typeof body.initialBalanceMinor).toBe('string');
        const row: Account = {
          ...metadata(),
          ...body,
          isActive: true,
          balanceMinor: body.initialBalanceMinor,
        };
        accounts.push(row);
        return reply(row, 201);
      }
      return reply(accounts.map((row) => ({ ...row, balanceMinor: balance(row) })));
    }
    if (url.pathname.includes('/accounts/') && request.method() === 'PATCH') {
      const row = accounts.find((account) => account.id === url.pathname.split('/').at(-1))!;
      Object.assign(row, request.postDataJSON());
      return reply({ ...row, balanceMinor: balance(row) });
    }
    if (url.pathname.endsWith('/categories')) {
      if (request.method() === 'POST') {
        const row = { ...metadata(), ...request.postDataJSON(), isActive: true };
        categories.push(row);
        return reply(row, 201);
      }
      return reply(categories);
    }
    if (url.pathname.endsWith('/transfers')) {
      state.transferWrites++;
      const body = request.postDataJSON();
      expect(body.sourceAccountId).not.toBe(body.destinationAccountId);
      expect(body.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
      const row: Transfer = { ...metadata(), ...body, isCancelled: false };
      movements.push({
        id: row.id,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        accountId: row.sourceAccountId,
        destinationAccountId: row.destinationAccountId,
        categoryId: null,
        type: 'TRANSFER',
        amountMinor: row.amountMinor,
        currency: row.currency,
        description: row.description,
        occurredAt: row.occurredAt,
        isCancelled: false,
      });
      return reply(row, 201);
    }
    if (url.pathname.endsWith('/transactions')) {
      if (request.method() === 'POST') {
        state.transactionWrites++;
        const body = request.postDataJSON();
        expect(body.authUserId).toBeUndefined();
        const row = {
          ...metadata(),
          ...body,
          categoryId: body.categoryId ?? null,
          destinationAccountId: null,
          isCancelled: false,
        };
        movements.push(row);
        return reply(row, 201);
      }
      state.filters.push(url.search);
      const rows = movements.filter(
        (row) =>
          (!url.searchParams.get('type') || row.type === url.searchParams.get('type')) &&
          (!url.searchParams.get('accountId') ||
            row.accountId === url.searchParams.get('accountId') ||
            row.destinationAccountId === url.searchParams.get('accountId')) &&
          (!url.searchParams.get('categoryId') ||
            row.categoryId === url.searchParams.get('categoryId')),
      );
      return reply({ items: rows, nextCursor: null });
    }
    if (url.pathname.endsWith('/summary')) {
      const currencies = [...new Set(accounts.map((account) => account.currency))].map(
        (currency) => {
          const rows = movements.filter((row) => row.currency === currency && !row.isCancelled);
          const income = rows
            .filter((row) => row.type === 'INCOME')
            .reduce((sum, row) => sum + BigInt(row.amountMinor), 0n);
          const expense = rows
            .filter((row) => row.type === 'EXPENSE')
            .reduce((sum, row) => sum + BigInt(row.amountMinor), 0n);
          return {
            currency,
            totalBalanceMinor: String(
              accounts
                .filter((account) => account.currency === currency)
                .reduce((sum, account) => sum + BigInt(balance(account)), 0n),
            ),
            incomeMinor: String(income),
            expenseMinor: String(expense),
            netMinor: String(income - expense),
          };
        },
      );
      return reply({
        from: url.searchParams.get('from'),
        to: url.searchParams.get('to'),
        currencies,
      });
    }
    return reply({}, 404);
  });
  return { state, accounts, categories, movements };
}
async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(
    page.getByRole('heading', { name: 'Bom ter você aqui, Conta Teste.' }),
  ).toBeVisible();
}
async function createAccount(page: Page, name: string, initial: string) {
  await page.getByRole('button', { name: 'Nova conta', exact: true }).click();
  await page.getByLabel('Nome da conta').fill(name);
  await page.getByLabel('Saldo inicial').fill(initial);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}
test('financial empty state → account → categories → income/expense → atomic transfer → reload', async ({
  page,
}, testInfo) => {
  const fixture = await boundary(page);
  await login(page);
  await page.getByRole('link', { name: 'Finanças', exact: true }).click();
  await expect(page.getByText('Sua primeira conta é o começo.')).toBeVisible();
  await page.getByRole('link', { name: 'Criar primeira conta' }).click();
  await createAccount(page, 'Principal', '1000');
  await createAccount(page, 'Reserva', '0');
  await page.getByRole('link', { name: 'Categorias', exact: true }).click();
  await page.getByLabel('Nome da categoria').fill('Salário');
  await page.getByLabel('Tipo da categoria').selectOption('INCOME');
  await page.getByRole('button', { name: 'Criar categoria' }).click();
  await expect(page.getByText('Salário', { exact: true })).toBeVisible();
  await page.getByLabel('Nome da categoria').fill('Mercado');
  await page.getByLabel('Tipo da categoria').selectOption('EXPENSE');
  await page.getByRole('button', { name: 'Criar categoria' }).click();
  await expect(page.getByText('Mercado', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Movimentos', exact: true }).click();
  for (const [kind, description, amount, category] of [
    ['Receita', 'Pagamento', '200', 'Salário'],
    ['Despesa', 'Compras', '50', 'Mercado'],
  ]) {
    await page.getByRole('button', { name: 'Novo movimento', exact: true }).click();
    await page.getByRole('button', { name: kind, exact: true }).click();
    await page.getByLabel('Conta', { exact: true }).selectOption({ label: 'Principal · BRL' });
    await page.getByLabel('Categoria', { exact: true }).selectOption({ label: category });
    await page.getByLabel('Valor (BRL)').fill(amount!);
    await page.getByLabel('Descrição').fill(description!);
    await page
      .getByRole('button', { name: kind === 'Receita' ? 'Registrar receita' : 'Registrar despesa' })
      .click();
    await expect(page.getByText(description!, { exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Novo movimento', exact: true }).click();
  await page.getByRole('button', { name: 'Transferência', exact: true }).click();
  await page.getByLabel('Conta de origem').selectOption({ label: 'Principal · BRL' });
  await page.getByLabel('Conta de destino').selectOption({ label: 'Reserva' });
  await page.getByLabel('Valor (BRL)').fill('100');
  await page.getByLabel('Descrição').fill('Guardar');
  await page.getByRole('button', { name: 'Registrar transferência' }).click();
  await expect(page.getByText('Guardar', { exact: true })).toBeVisible();
  expect(fixture.state.accountWrites).toBe(2);
  expect(fixture.state.transactionWrites).toBe(2);
  expect(fixture.state.transferWrites).toBe(1);
  await page.getByRole('link', { name: 'Visão geral', exact: true }).click();
  await expect(page.locator('.finance-summary').getByText(/1\.150,00/)).toBeVisible();
  await expect(page.locator('.finance-account-grid').getByText(/1\.050,00/)).toBeVisible();
  await page.reload();
  await expect(page.locator('.finance-summary').getByText(/1\.150,00/)).toBeVisible();
  expect(fixture.state.logins).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  if (process.env.FINANCE_VISUAL_QA === '1')
    await page.screenshot({ path: `.harness/logs/mdl2-finance-${testInfo.project.name}.png`, fullPage: true });
});
test('validation and API errors are visible without inventing successful writes', async ({
  page,
}) => {
  const fixture = await boundary(page, { accountFailure: true });
  await login(page);
  await page.goto('/finance/accounts');
  await page.getByRole('button', { name: 'Nova conta', exact: true }).click();
  await page.getByLabel('Nome da conta').fill('Conta');
  await page.getByLabel('Saldo inicial').fill('1.000,50');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('valor válido');
  expect(fixture.state.accountWrites).toBe(0);
  await page.getByLabel('Saldo inicial').fill('10');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível concluir');
  expect(fixture.state.accountWrites).toBe(1);
});
test('filters use selected account/type/period and clearing restores the first page', async ({
  page,
}) => {
  const fixture = await boundary(page);
  await login(page);
  await page.goto('/finance/accounts');
  await createAccount(page, 'Principal', '0');
  await page.getByRole('link', { name: 'Movimentos', exact: true }).click();
  await page.getByLabel('Filtrar conta').selectOption({ label: 'Principal' });
  await page.getByLabel('Filtrar tipo').selectOption('EXPENSE');
  await page.getByLabel('Data inicial').fill('2026-01-01');
  await page.getByLabel('Data final').fill('2026-01-31');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect.poll(() => fixture.state.filters.at(-1)).toContain('type=EXPENSE');
  const params = new URLSearchParams(fixture.state.filters.at(-1));
  expect(params.get('accountId')).toBe(fixture.accounts[0]!.id);
  expect(params.get('from')).toBe('2026-01-01T03:00:00.000Z');
  expect(params.get('to')).toBe('2026-02-01T03:00:00.000Z');
  await page.getByRole('button', { name: 'Limpar', exact: true }).click();
  // The original unfiltered page may be served from QueryClient's valid cache.
  await expect(page.getByLabel('Filtrar conta')).toHaveValue('');
  await expect(page.getByLabel('Filtrar tipo')).toHaveValue('');
  await expect(page.getByLabel('Data inicial')).toHaveValue('');
  await page.reload();
  await expect.poll(() => fixture.state.filters.at(-1)).toBe('?limit=25');
});
test('Finance loading remains accessible and logout revokes protected UI access', async ({
  page,
}) => {
  await boundary(page, { slow: true });
  await login(page);
  await page.getByRole('link', { name: 'Finanças', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByText('Sua primeira conta é o começo.')).toBeVisible();
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await page.goto('/finance/transactions');
  await expect(page).toHaveURL('http://localhost:3103/login');
});
