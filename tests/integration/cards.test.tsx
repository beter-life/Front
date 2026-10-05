import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
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
import { publicEnv, session, profile } from '../helpers';
import { cardFixture, cardViewFixture, cardPurchase, cardAccount, bankAccount, expenseCategory, cardsSummaryFixture } from '../fixtures/cards';
function setup(path = '/finance/cards', handler?: (url: URL, options?: RequestInit) => Response, signedIn = true) {
  const client = { auth: { onAuthStateChange: vi.fn(), signOut: vi.fn() } } as unknown as AuthClientV2, store = new SessionStore(client.auth); store.accept(signedIn ? session : null);
  const writes: { path: string; body: Record<string, unknown> }[] = [];
  const fetcher = vi.fn<typeof fetch>(async (url, options) => { const parsed = new URL(String(url)); if (parsed.pathname.endsWith('/me')) return Response.json({ identity: { authUserId: session.user.id }, profile }); if (options?.method !== 'GET') writes.push({ path: parsed.pathname, body: JSON.parse(String(options?.body)) }); return handler?.(parsed, options) ?? defaults(parsed, options); });
  const services = createServices(publicConfig(publicEnv), store, fetcher);
  render(<StrictMode><AuthProviderV2 client={client} store={store}><AppProviders services={services}><MemoryRouter initialEntries={[path]}><AuthV2Routes /></MemoryRouter></AppProviders></AuthProviderV2></StrictMode>);
  return { user: userEvent.setup(), writes, fetcher };
}
function defaults(url: URL, options?: RequestInit) { const p = url.pathname; if (options?.method === 'POST') return Response.json(p.endsWith('/purchases') ? cardPurchase : cardFixture, { status: p.endsWith('/archive') ? 200 : 201 }); return Response.json(p.endsWith('/accounts') ? [bankAccount, cardAccount] : p.endsWith('/categories') ? [expenseCategory] : p.endsWith('/summary') ? cardsSummaryFixture : p.endsWith('/purchases') ? { items: [cardPurchase], nextCursor: null } : p.endsWith('/cards') ? [cardFixture] : cardViewFixture()); }
describe('cards frontend boundary', () => {
  it('dashboard differentiates recognized liability and future commitments, GET only', async () => { const { fetcher } = setup(); expect(await screen.findByRole('heading', { name: 'Cartão teste · BRL' })).toBeVisible(); expect(screen.getByText('Saldo real do cartão')).toBeVisible(); expect(screen.getByText('Parcelas futuras')).toBeVisible(); expect(screen.getByText('Limite disponível estimado')).toBeVisible(); expect(fetcher.mock.calls.every(([, o]) => o?.method === 'GET')).toBe(true); });
  it('new card positive debt input becomes initialDebtMinor, no PAN/CVV or owner payload', async () => { const { user, writes } = setup('/finance/cards', (url, options) => url.pathname.endsWith('/cards') && options?.method === 'GET' ? Response.json([]) : defaults(url, options)); await screen.findByRole('heading', { name: 'Nenhum cartão cadastrado' }); await user.click(screen.getByRole('button', { name: 'Novo cartão' })); await user.type(screen.getByLabelText('Nome do cartão'), 'Novo teste'); await user.clear(screen.getByLabelText('Dívida atual (valor positivo)')); await user.type(screen.getByLabelText('Dívida atual (valor positivo)'), '500'); await user.click(screen.getByRole('button', { name: 'Salvar cartão' })); await waitFor(() => expect(writes).toHaveLength(1)); expect(writes[0]?.body.initialDebtMinor).toBe('50000'); expect(writes[0]?.body).not.toHaveProperty('ownerId'); expect(writes[0]?.body).not.toHaveProperty('pan'); });
  it('current form values and exact preview, StrictMode makes one purchase request', async () => {
    const { user, writes } = setup('/finance/cards/' + cardFixture.id);
    await screen.findByRole('heading', { name: 'Saldo real e compromissos' });
    await user.click(screen.getByRole('button', { name: 'Nova compra' }));
    await user.type(screen.getByLabelText('Descrição da compra'), 'Compra atual');
    await user.selectOptions(screen.getByLabelText('Categoria de despesa'), expenseCategory.id);
    await user.type(screen.getByLabelText('Valor total (BRL)'), '1000');
    await user.clear(screen.getByLabelText('Quantidade de parcelas'));
    await user.type(screen.getByLabelText('Quantidade de parcelas'), '3');
    expect(within(screen.getByLabelText('Prévia das parcelas')).getByText(/3\/3.*333,34/)).toBeVisible();
    await user.dblClick(screen.getByRole('button', { name: 'Registrar compra' }));
    await waitFor(() => expect(writes).toHaveLength(1));
    expect(writes[0]?.body).toMatchObject({ description: 'Compra atual', totalAmountMinor: '100000', installmentCount: 3 });
    expect(writes[0]?.path).toContain('/cards/');
  });
  it('payment calls convenience endpoint, never generic expense, message explicit', async () => { const { user, writes } = setup('/finance/cards/' + cardFixture.id, (url, o) => o?.method === 'POST' && url.pathname.endsWith('/payments') ? Response.json({ id: crypto.randomUUID(), sourceAccountId: bankAccount.id, destinationAccountId: cardAccount.id, amountMinor: '33333', currency: 'BRL', description: 'Payment', occurredAt: '2026-10-05T12:00:00Z', idempotencyKey: crypto.randomUUID(), createdAt: '2026-10-05T12:00:00Z', updatedAt: '2026-10-05T12:00:00Z', isCancelled: false }, { status: 201 }) : defaults(url, o)); await screen.findByRole('heading', { name: 'Saldo real e compromissos' }); await user.click(screen.getByRole('button', { name: 'Pagar fatura' })); expect(screen.getByText(/Pagamento será registrado como transferência/)).toBeVisible(); await user.selectOptions(screen.getByLabelText('Conta de origem'), bankAccount.id); await user.click(screen.getByRole('button', { name: 'Registrar pagamento' })); await waitFor(() => expect(writes).toHaveLength(1)); expect(writes[0]?.path).toMatch(/\/payments$/); expect(writes[0]?.body.amountMinor).toBe('33333'); expect(writes[0]?.body).not.toHaveProperty('type'); });
  it('archive retains future invoices/history and payment while blocking purchase/settings', async () => { setup('/finance/cards/' + cardFixture.id, url => url.pathname.endsWith('/' + cardFixture.id) ? Response.json(cardViewFixture({ card: { ...cardFixture, status: 'ARCHIVED', archivedAt: '2026-10-05T12:00:00Z' } })) : defaults(url)); await screen.findByRole('heading', { name: 'Saldo real e compromissos' }); expect(screen.getByRole('button', { name: 'Nova compra' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Nova regra de ciclo' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Pagar fatura' })).toBeEnabled(); expect(screen.getByRole('heading', { name: 'Fatura · 2026-11-10 · Próxima' })).toBeVisible(); expect(screen.getByRole('heading', { name: 'Histórico de compras' })).toBeVisible(); });
  it('error/retry and unauthenticated guards', async () => { setup('/finance/cards', () => Response.json({}, { status: 503 })); expect(await screen.findByText('Não foi possível carregar os cartões.')).toBeVisible(); expect(screen.getAllByRole('button', { name: 'Tentar novamente' }).length).toBeGreaterThan(0); });
  it('protects cards route without session', async () => { const { fetcher } = setup('/finance/cards/' + cardFixture.id, undefined, false); expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible(); expect(fetcher.mock.calls).toHaveLength(0); });
});
