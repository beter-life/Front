import { StrictMode } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AuthV2Routes } from '../../src/auth-v2/app';
import { AuthProviderV2 } from '../../src/auth-v2/provider';
import { SessionStore } from '../../src/auth-v2/session';
import type { AuthClientV2 } from '../../src/auth-v2/client';
import { AppProviders } from '../../src/app/providers';
import { createServices } from '../../src/app/services';
import { publicConfig } from '../../src/config/env';
import { publicEnv, session, profile, deferred } from '../helpers';
import { allocation, budgetSummary, category, emptyBudget, period } from '../fixtures/budgets';
import type { BudgetSummary } from '../../src/features/finance/contracts.generated';

function setup(
  fetcher: typeof fetch,
  signedIn = true,
  path = '/finance/budgets?month=2026-10&currency=BRL',
) {
  const client = {
    auth: { onAuthStateChange: vi.fn(), signOut: vi.fn() },
  } as unknown as AuthClientV2;
  const store = new SessionStore(client.auth);
  store.accept(signedIn ? session : null);
  const services = createServices(publicConfig(publicEnv), store, fetcher);
  render(
    <StrictMode>
      <AuthProviderV2 client={client} store={store}>
        <AppProviders services={services}>
          <MemoryRouter initialEntries={[path]}>
            <AuthV2Routes />
          </MemoryRouter>
        </AppProviders>
      </AuthProviderV2>
    </StrictMode>,
  );
  return { user: userEvent.setup(), store };
}
function boundary(
  getSummary: () => BudgetSummary,
  write?: (
    method: string,
    body: Record<string, unknown>,
    path: string,
  ) => Response | Promise<Response>,
): typeof fetch {
  return async (url, options) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/me'))
      return Response.json({ identity: { authUserId: session.user.id }, profile });
    if (path.endsWith('/categories'))
      return Response.json([
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
    if (options?.method !== 'GET' && write)
      return write(options?.method ?? '', JSON.parse(String(options?.body ?? '{}')), path);
    return Response.json(getSummary());
  };
}
afterEach(() => vi.unstubAllGlobals());
describe('budget UI with real transport, query cache and Auth V2 guard', () => {
  it('creates an empty budget, submits the current expense category and exact zero/positive input once', async () => {
    let s = emptyBudget();
    const writes: string[] = [];
    const app = setup(
      boundary(
        () => s,
        (method, body) => {
          writes.push(method);
          if (method === 'PUT') {
            s = emptyBudget({ periodId: period.id });
            return Response.json(period);
          }
          expect(body).toEqual({
            currency: 'BRL',
            amountMinor: '50000',
            rolloverPolicy: 'POSITIVE_ONLY',
          });
          s = budgetSummary();
          return Response.json({ ...allocation, rolloverPolicy: 'POSITIVE_ONLY' });
        },
      ),
    );
    await app.user.click(await screen.findByRole('button', { name: 'Criar orçamento deste mês' }));
    await app.user.click(await screen.findByRole('button', { name: 'Adicionar categoria' }));
    expect(screen.queryByRole('option', { name: 'Salário' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Inativa' })).not.toBeInTheDocument();
    await app.user.selectOptions(screen.getByLabelText('Categoria de despesa'), category.id);
    await app.user.type(screen.getByLabelText('Limite planejado'), '500,00');
    await app.user.selectOptions(screen.getByLabelText('Sobra do mês anterior'), 'POSITIVE_ONLY');
    await app.user.dblClick(screen.getByRole('button', { name: 'Adicionar limite' }));
    expect(await screen.findByRole('heading', { name: 'Alimentação' })).toBeVisible();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '20%');
    expect(writes).toEqual(['PUT', 'PATCH']);
    const card = screen.getByRole('heading', { name: 'Alimentação' }).closest('.budget-category')!;
    expect(within(card as HTMLElement).getByText(/400,00/)).toBeVisible();
  });
  it('edits a limit, rejects negative input locally and displays safe API errors', async () => {
    let calls = 0;
    const app = setup(
      boundary(
        () => budgetSummary(),
        () => {
          calls++;
          return Response.json({}, { status: 409 });
        },
      ),
    );
    await app.user.click(await screen.findByRole('button', { name: 'Editar limite' }));
    expect(screen.getByLabelText('Limite planejado')).toHaveValue('500.00');
    await app.user.clear(screen.getByLabelText('Limite planejado'));
    await app.user.type(screen.getByLabelText('Limite planejado'), '-1');
    await app.user.click(screen.getByRole('button', { name: 'Salvar limite' }));
    expect(await screen.findByText('Confira os campos informados.')).toBeVisible();
    expect(calls).toBe(0);
    await app.user.clear(screen.getByLabelText('Limite planejado'));
    await app.user.type(screen.getByLabelText('Limite planejado'), '0');
    await app.user.click(screen.getByRole('button', { name: 'Salvar limite' }));
    expect(
      await screen.findByText(
        'O registro está inativo ou a operação conflita com uma solicitação anterior.',
      ),
    ).toBeVisible();
    expect(calls).toBe(1);
  });
  it('copies once without overwriting and displays positive rollover and unplanned spending', async () => {
    let copies = 0;
    const pending = deferred<Response>();
    const app = setup(
      boundary(
        () =>
          budgetSummary({
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
            expenseTotalMinor: '25000',
            unbudgetedCategories: [
              {
                categoryId: null,
                categoryName: null,
                categoryIsActive: false,
                spentMinor: '15000',
              },
            ],
          }),
        () => {
          copies++;
          return pending.promise;
        },
      ),
    );
    expect(await screen.findByText(/Sobra positiva:.*80,00.*Disponível:.*580,00/)).toBeVisible();
    expect(screen.getByText('Sem categoria')).toBeVisible();
    await app.user.dblClick(screen.getByRole('button', { name: 'Copiar mês anterior' }));
    expect(copies).toBe(1);
    pending.resolve(
      Response.json({ period, copiedCount: 0, alreadyPresentCount: 1, skippedInactiveCount: 1 }),
    );
    expect(
      await screen.findByText(
        '0 limites copiados. 1 existentes preservados. 1 categorias inativas ignoradas.',
      ),
    ).toBeVisible();
    expect(copies).toBe(1);
  });
  it.each([
    ['ON_TRACK', 'Dentro do ritmo'],
    ['ATTENTION', 'Acima do ritmo'],
    ['OVER_BUDGET', 'Acima do orçamento'],
  ] as const)(
    'communicates %s with text and a capped accessible progress bar',
    async (paceStatus, text) => {
      setup(
        boundary(() =>
          budgetSummary({
            paceStatus,
            categories: [
              {
                ...budgetSummary().categories[0]!,
                paceStatus,
                utilizationPercent: '140.00',
                remainingMinor: '-20000',
              },
            ],
          }),
        ),
      );
      expect((await screen.findAllByText(text))[0]).toBeVisible();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '140%');
    },
  );
  it('shows accessible loading until the summary is available', async () => {
    const result = deferred<Response>();
    const other = boundary(() => emptyBudget());
    setup((url, options) =>
      String(url).includes('/summary') ? result.promise : other(url, options),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Carregando orçamento…');
    result.resolve(Response.json(emptyBudget()));
    expect(await screen.findByText('Seu orçamento começa aqui.')).toBeVisible();
  });
  it('blocks an invalid month before requesting the summary', async () => {
    const other = boundary(() => emptyBudget());
    const calls: string[] = [];
    setup(
      (url, options) => {
        calls.push(String(url));
        return other(url, options);
      },
      true,
      '/finance/budgets?month=2026-13&currency=BRL',
    );
    expect(await screen.findByText('Escolha um mês e uma moeda válidos.')).toBeVisible();
    expect(calls.some((c) => c.includes('/budgets'))).toBe(false);
  });
  it('does not request private data while signed out', async () => {
    const fetcher = vi.fn<typeof fetch>();
    setup(fetcher, false);
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('deactivates an allocation only after explicit confirmation', async () => {
    let s = budgetSummary();
    let removed = 0;
    const app = setup(
      boundary(
        () => s,
        (method) => {
          expect(method).toBe('DELETE');
          removed++;
          s = emptyBudget({
            periodId: period.id,
            unbudgetedSpendingMinor: '10000',
            expenseTotalMinor: '10000',
            unbudgetedCategories: [
              {
                categoryId: category.id,
                categoryName: category.name,
                categoryIsActive: true,
                spentMinor: '10000',
              },
            ],
          });
          return Response.json({ ...allocation, isActive: false });
        },
      ),
    );
    await app.user.click(await screen.findByRole('button', { name: 'Remover limite' }));
    expect(removed).toBe(0);
    await app.user.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    expect(removed).toBe(1);
    expect(screen.getByText('Alimentação')).toBeVisible();
  });
});
