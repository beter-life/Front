import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { AuthV2Routes } from '../../src/auth-v2/app';
import type { AuthClientV2 } from '../../src/auth-v2/client';
import { AuthProviderV2 } from '../../src/auth-v2/provider';
import { SessionStore } from '../../src/auth-v2/session';
import { session } from '../helpers';

function setup(path: string, initiallySignedIn = false, configure?: (auth: ReturnType<typeof authMethods>, emit: (event: string, value: Session | null) => void) => void) {
  let emit!: (event: string, value: Session | null) => void;
  const auth = authMethods((listener) => { emit = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  const client = { auth } as unknown as AuthClientV2;
  const store = new SessionStore(client.auth);
  store.start();
  emit('INITIAL_SESSION', initiallySignedIn ? session : null);
  configure?.(auth, emit);
  window.history.replaceState(null, '', path);
  render(<StrictMode><AuthProviderV2 client={client} store={store}><MemoryRouter initialEntries={[path]}><AuthV2Routes apiBaseUrl="http://localhost:3001" /></MemoryRouter></AuthProviderV2></StrictMode>);
  return { auth, store, emit, user: userEvent.setup() };
}

function authMethods(onAuthStateChange: (listener: (event: string, value: Session | null) => void) => unknown) {
  return {
    onAuthStateChange: vi.fn(onAuthStateChange),
    signInWithPassword: vi.fn(), signOut: vi.fn(), signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(),
  };
}

afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState(null, '', '/'); });

describe('clean-room routes with independently mocked boundaries', () => {
  it('logs in, opens a protected route, reads /me with its profile, and logs out', async () => {
    const backend = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      expect(url).toBe('http://localhost:3001/api/v1/me');
      expect(new Headers(options?.headers).get('authorization')).toBe(`Bearer ${session.access_token}`);
      return new Response(JSON.stringify({ identity: { authUserId: session.user.id }, profile: null }), { status: 200 });
    });
    vi.stubGlobal('fetch', backend);
    const app = setup('/login');
    app.auth.signInWithPassword.mockImplementation(async () => { app.emit('SIGNED_IN', session); return { data: { session }, error: null }; });
    app.auth.signOut.mockImplementation(async () => { app.emit('SIGNED_OUT', null); return { error: null }; });
    await app.user.type(screen.getByLabelText('E-mail'), '  TeSt@Example.Test  ');
    await app.user.type(screen.getByLabelText('Senha', { exact: true }), 'safe-password');
    await app.user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }));
    expect(app.auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'test@example.test', password: 'safe-password' });
    expect(await screen.findByRole('heading', { name: 'Seu espaço começa com você.' })).toBeVisible();
    expect(backend).toHaveBeenCalled();
    const [url, options] = backend.mock.calls[0]!;
    expect(url).toBe('http://localhost:3001/api/v1/me');
    expect(new Headers(options?.headers).get('authorization')).toBe(`Bearer ${session.access_token}`);
    await app.user.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
    expect(app.store.getSnapshot().status).toBe('unauthenticated');
    expect(app.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('blocks a protected route while unauthenticated', async () => {
    setup('/app');
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
  });

  it('keeps signup and recovery requests publicly neutral', async () => {
    const app = setup('/forgot-password');
    app.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { code: 'unknown_user' } });
    await app.user.type(screen.getByLabelText('E-mail'), 'test@example.test');
    await app.user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    expect(await screen.findByRole('heading', { name: 'Solicitação recebida.' })).toBeVisible();
    expect(app.auth.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith('test@example.test', { redirectTo: window.location.origin + '/auth/recovery' });
    expect(screen.getByText('Se a conta puder receber recuperação, enviaremos as instruções.')).toBeVisible();
  });

  it('verifies a signup token hash only once under StrictMode and removes it from the URL', async () => {
    const app = setup('/auth/confirm?token_hash=synthetic-hash&type=email', false, (auth) => {
      auth.verifyOtp.mockResolvedValue({ data: { user: session.user, session: null }, error: null });
    });
    expect(await screen.findByRole('heading', { name: 'E-mail confirmado.' })).toBeVisible();
    expect(app.auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'synthetic-hash', type: 'email' });
    expect(new URL(window.location.href).searchParams.has('token_hash')).toBe(false);
  });

  it('verifies recovery only once, requires a session, and updates the password', async () => {
    const app = setup('/auth/recovery?token_hash=synthetic-hash&type=recovery', false, (auth, emit) => {
      auth.verifyOtp.mockImplementation(async () => { emit('PASSWORD_RECOVERY', session); return { data: { user: session.user, session }, error: null }; });
    });
    app.auth.updateUser.mockResolvedValue({ data: { user: session.user }, error: null });
    app.auth.signOut.mockImplementation(async () => { app.emit('SIGNED_OUT', null); return { error: null }; });
    expect(await screen.findByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
    expect(app.auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'synthetic-hash', type: 'recovery' });
    await waitFor(() => expect(new URL(window.location.href).searchParams.has('token_hash')).toBe(false));
    await app.user.type(screen.getByLabelText('Nova senha', { exact: true }), 'new-password');
    await app.user.type(screen.getByLabelText('Confirmar nova senha'), 'new-password');
    await app.user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(app.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ password: 'new-password' });
    expect(await screen.findByText('Senha atualizada. Entre com sua nova senha.')).toBeVisible();
  });
});
