import { StrictMode } from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
import { FinanceForm, Field } from '../../src/features/finance/forms';

function setup(path: string, fetcher: typeof fetch, signedIn = true) {
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
  return { user: userEvent.setup(), services, store };
}
afterEach(() => vi.unstubAllGlobals());
const me = { identity: { authUserId: session.user.id }, profile };
describe('finance UI with real services and external transport only', () => {
  it('has a financial empty state, creates the first account and refreshes its balance', async () => {
    let saved = false;
    let writes = 0;
    const fetcher: typeof fetch = async (url, options) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/me')) return Response.json(me);
      if (options?.method === 'POST') {
        writes++;
        saved = true;
        expect(JSON.parse(String(options.body))).toEqual({
          name: 'Conta principal',
          type: 'checking',
          currency: 'BRL',
          initialBalanceMinor: '1050',
        });
      }
      const account = {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Conta principal',
        type: 'checking',
        currency: 'BRL',
        initialBalanceMinor: '1050',
        balanceMinor: '1050',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };
      return Response.json(options?.method === 'POST' ? account : saved ? [account] : []);
    };
    const app = setup('/finance/accounts', fetcher);
    expect(await screen.findByText('Nenhuma conta cadastrada')).toBeVisible();
    await app.user.click(screen.getByRole('button', { name: 'Criar conta' }));
    await app.user.type(screen.getByLabelText('Nome da conta'), 'Conta principal');
    await app.user.clear(screen.getByLabelText('Saldo inicial'));
    await app.user.type(screen.getByLabelText('Saldo inicial'), '10,50');
    await app.user.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByRole('heading', { name: 'Conta principal' })).toBeVisible();
    expect(screen.getByText(/10,50/)).toBeVisible();
    expect(writes).toBe(1);
  });
  it('handles a transport failure and never calls finance while signed out', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 503 }));
    setup('/finance/accounts', fetcher);
    expect(await screen.findByText('Não foi possível carregar suas contas.')).toBeVisible();
  });
  it('protects Finance with the existing Auth V2 guard', async () => {
    const fetcher = vi.fn<typeof fetch>();
    setup('/finance/accounts', fetcher, false);
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('prevents double submit, locks fields and provides sanitized failure/success feedback', async () => {
    let resolve!: () => void;
    const action = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const user = userEvent.setup();
    render(
      <StrictMode>
        <FinanceForm submit={action}>
          <Field label="Test value" name="value" required />
        </FinanceForm>
      </StrictMode>,
    );
    await user.type(screen.getByLabelText('Test value'), 'x');
    await user.dblClick(screen.getByRole('button', { name: 'Salvar' }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Test value')).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.getByText('Registro salvo.')).toBeVisible());
  });
});
