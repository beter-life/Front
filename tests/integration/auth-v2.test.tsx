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
import { AppProviders } from '../../src/app/providers';
import { createServices } from '../../src/app/services';
import { publicConfig } from '../../src/config/env';
import { profile, publicEnv, session } from '../helpers';

function setup(path: string, initiallySignedIn = false, configure?: (auth: ReturnType<typeof authMethods>, emit: (event: string, value: Session | null) => void) => void) {
  let emit!: (event: string, value: Session | null) => void;
  const auth = authMethods((listener) => { emit = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
  const client = { auth } as unknown as AuthClientV2;
  const store = new SessionStore(client.auth);
  store.start();
  emit('INITIAL_SESSION', initiallySignedIn ? session : null);
  configure?.(auth, emit);
  window.history.replaceState(null, '', path);
  const services = createServices(publicConfig(publicEnv), store);
  render(<StrictMode><AuthProviderV2 client={client} store={store}><AppProviders services={services}><MemoryRouter initialEntries={[path]}><AuthV2Routes /></MemoryRouter></AppProviders></AuthProviderV2></StrictMode>);
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
    expect(await screen.findByRole('heading', { name: 'Início' })).toBeVisible();
    expect(backend).toHaveBeenCalled();
    const [url, options] = backend.mock.calls[0]!;
    expect(url).toBe('http://localhost:3001/api/v1/me');
    expect(new Headers(options?.headers).get('authorization')).toBe(`Bearer ${session.access_token}`);
    await app.user.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
    expect(app.store.getSnapshot().status).toBe('unauthenticated');
    expect(app.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it('blocks a protected route while unauthenticated', async () => {
    setup('/app');
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeVisible();
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
    expect(await screen.findByRole('heading', { name: 'Nova senha' })).toBeVisible();
    expect(app.auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'synthetic-hash', type: 'recovery' });
    await waitFor(() => expect(new URL(window.location.href).searchParams.has('token_hash')).toBe(false));
    await app.user.type(screen.getByLabelText('Nova senha', { exact: true }), 'new-password');
    await app.user.type(screen.getByLabelText('Confirmar nova senha'), 'new-password');
    await app.user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(app.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ password: 'new-password' });
    expect(await screen.findByText('Senha atualizada. Entre com sua nova senha.')).toBeVisible();
  });

  it('edits the authenticated profile using PUT /me/profile without an ownership field', async () => {
    let saved = profile;
    const backend = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      if (options?.method === 'PUT') {
        expect(url).toBe('http://localhost:3001/api/v1/me/profile');
        const payload = JSON.parse(options.body as string);
        expect(Object.keys(payload).sort()).toEqual(['displayName', 'locale', 'timezone']);
        saved = { ...profile, ...payload };
        return new Response(JSON.stringify(saved));
      }
      return new Response(JSON.stringify({ identity: { authUserId: session.user.id }, profile: saved }));
    });
    vi.stubGlobal('fetch', backend);
    const app = setup('/profile', true);
    const name = await screen.findByLabelText('Como prefere ser chamado?');
    await app.user.clear(name); await app.user.type(name, 'Perfil atualizado');
    await app.user.click(screen.getByRole('button', { name: 'Salvar perfil' }));
    expect(await screen.findByText('Perfil salvo.')).toBeVisible();
    expect(saved.displayName).toBe('Perfil atualizado');
  });

  it('changes a password in a protected session and preserves access', async () => {
    const app = setup('/account/password', true);
    app.auth.updateUser.mockResolvedValue({ data: { user: session.user }, error: null });
    await app.user.type(screen.getByLabelText('Nova senha', { exact: true }), 'new-password');
    await app.user.type(screen.getByLabelText('Confirmar nova senha'), 'new-password');
    await app.user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByText('Senha atualizada.')).toBeVisible();
    expect(app.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ password: 'new-password' });
    expect(app.store.getSnapshot().status).toBe('authenticated');
    expect(app.auth.signOut).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nova senha', { exact: true })).toHaveValue('');
  });

  it('sanitizes a failed authenticated password update and keeps the form available', async () => {
    const app = setup('/account/password', true);
    app.auth.updateUser.mockResolvedValue({ data: { user: null }, error: { message: 'provider private error' } });
    await app.user.type(screen.getByLabelText('Nova senha', { exact: true }), 'new-password');
    await app.user.type(screen.getByLabelText('Confirmar nova senha'), 'new-password');
    await app.user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByText('Não foi possível atualizar a senha. Tente novamente.')).toBeVisible();
    expect(screen.queryByText('provider private error')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar nova senha' })).toBeEnabled();
  });
});
