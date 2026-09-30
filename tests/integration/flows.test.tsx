import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { StrictMode } from 'react';
import { AppProviders } from '../../src/app/providers';
import { createServices } from '../../src/app/services';
import { publicConfig } from '../../src/config/env';
import { AppRoutes } from '../../src/routing/routes';
import type { AuthCallback } from '../../src/auth/callback';
import type { AuthGateway, CallbackSession } from '../../src/auth/gateway';
import { deferred, fakeGateway, input, owner, profile, publicEnv, session } from '../helpers';

function setup(path: string, gateway: AuthGateway = fakeGateway().gateway, callback: AuthCallback | null = null, fetcher?: typeof fetch) {
  let stored: typeof profile | null = null;
  const external = fetcher ?? vi.fn<typeof fetch>(async (_url, init) => {
    if (init?.method === 'PUT') { stored = { ...profile, ...JSON.parse(init.body as string) }; return new Response(JSON.stringify(stored)); }
    return new Response(JSON.stringify({ identity: { authUserId: owner }, profile: stored }));
  });
  const services = createServices(publicConfig(publicEnv), 'http://localhost:3101', callback, gateway, external);
  render(<StrictMode><AppProviders services={services}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AppProviders></StrictMode>);
  return { services, user: userEvent.setup(), external };
}
describe('identity UI with mocked external boundaries', () => {
  it('validates login fields without calling Auth', async () => {
    const fake = fakeGateway(); const { user } = setup('/login', fake.gateway);
    await screen.findByRole('heading', { name: 'Bom ter você aqui.' });
    await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }));
    expect(await screen.findByText('Informe um e-mail válido.')).toBeVisible(); expect(screen.getByText('Informe sua senha.')).toBeVisible(); expect(fake.gateway.login).not.toHaveBeenCalled();
  });
  it('waits for initial session before deciding protected access', async () => {
    const pending = deferred<Session | null>(); const fake = fakeGateway(); fake.gateway.session = vi.fn(() => pending.promise);
    setup('/app', fake.gateway); expect(screen.getByRole('status')).toHaveTextContent('Preparando'); expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument();
    await act(async () => { pending.resolve(session); });
    expect(await screen.findByRole('heading', { name: 'Seu espaço começa com você.' })).toBeVisible();
  });
  it('redirects unauthenticated access, logs in, bootstraps and updates profile, then logs out', async () => {
    const fake = fakeGateway(); const { user, services } = setup('/app', fake.gateway);
    await user.type(await screen.findByLabelText('E-mail'), 'test@example.test'); await user.type(screen.getByLabelText('Senha'), 'test-password');
    await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }));
    await user.click(await screen.findByRole('link', { name: 'Completar meu perfil' }));
    await user.type(await screen.findByLabelText('Como prefere ser chamado?'), input.displayName);
    await user.clear(screen.getByLabelText('Fuso horário')); await user.type(screen.getByLabelText('Fuso horário'), input.timezone);
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }));
    await waitFor(() => expect(services.queryClient.getQueryData(['private', 'me', owner])).toMatchObject({ profile: { displayName: input.displayName } }));
    await user.click(screen.getByRole('link', { name: 'Voltar ao início' }));
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui, Pessoa Teste.' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Sair da conta' }));
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible(); expect(services.queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
  it('shows confirmation pending after signup without a session', async () => {
    const fake = fakeGateway(); const { user } = setup('/signup', fake.gateway);
    await user.type(await screen.findByLabelText('E-mail'), 'test@example.test'); await user.type(screen.getByLabelText('Senha'), 'test-password'); await user.type(screen.getByLabelText('Confirmar senha'), 'test-password');
    await user.click(screen.getByRole('button', { name: 'Criar minha conta' }));
    expect(await screen.findByRole('heading', { name: 'Falta só confirmar.' })).toBeVisible(); expect(screen.queryByRole('link', { name: 'Meu perfil' })).not.toBeInTheDocument();
  });
  it('shows safe Auth errors without reflecting provider details', async () => {
    const fake = fakeGateway(); fake.gateway.login = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
    const { user } = setup('/login', fake.gateway);
    await user.type(await screen.findByLabelText('E-mail'), 'test@example.test'); await user.type(screen.getByLabelText('Senha'), 'test-password'); await user.click(screen.getByRole('button', { name: 'Entrar na minha conta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir'); expect(screen.queryByText('private-provider-detail')).not.toBeInTheDocument();
  });
  it('clears private state and redirects on backend 401', async () => {
    const fake = fakeGateway(session); const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 401 }));
    const { services } = setup('/app', fake.gateway, null, fetcher);
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible(); expect(services.auth.getSnapshot().session).toBeNull(); expect(services.queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
  it('offers retry for backend outage', async () => {
    let available = false;
    const fetcher = vi.fn<typeof fetch>(async () => available ? new Response(JSON.stringify({ identity: { authUserId: owner }, profile: null })) : new Response('{}', { status: 503 }));
    const { user } = setup('/app', fakeGateway(session).gateway, null, fetcher);
    const retry = await screen.findByRole('button', { name: 'Tentar novamente' }); available = true;
    await user.click(retry); expect(await screen.findByRole('link', { name: 'Completar meu perfil' })).toBeVisible();
  });
  it('handles confirmation success and expired callback separately', async () => {
    const { services } = setup('/auth/confirm', fakeGateway().gateway, { kind: 'confirmation', hasCode: true, invalid: false });
    expect(await screen.findByRole('heading', { name: 'E-mail confirmado.' })).toBeVisible(); expect(services.auth.getSnapshot().status).toBe('authenticated');
  });
  it('rejects invalid confirmation without trusting URL error text', async () => {
    setup('/auth/confirm', fakeGateway().gateway, { kind: 'confirmation', hasCode: false, invalid: true });
    expect(await screen.findByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  });
  it('requests recovery with neutral response', async () => {
    const fake = fakeGateway(); const { user } = setup('/forgot-password', fake.gateway);
    await user.type(screen.getByLabelText('E-mail'), 'test@example.test'); await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    expect(await screen.findByRole('heading', { name: 'O próximo passo está no seu e-mail.' })).toBeVisible();
    expect(screen.getByText('Se houver uma conta para esse e-mail, enviaremos um link para criar uma nova senha.')).toBeVisible();
    expect(fake.gateway.recover).toHaveBeenCalledWith('test@example.test');
  });
  it('requires recovery session to update password and returns to login after success', async () => {
    const fake = fakeGateway(); fake.gateway.callbackSession = vi.fn(async () => ({ session, recovery: true }));
    const { user } = setup('/auth/recovery', fake.gateway, { kind: 'recovery', hasCode: true, invalid: false });
    await user.type(await screen.findByLabelText('Nova senha'), 'new-test-password'); await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-test-password'); await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible(); expect(fake.gateway.updatePassword).toHaveBeenCalledWith('new-test-password'); expect(fake.gateway.logout).toHaveBeenCalled();
  });
  it('keeps the new-password form usable when updateUser fails', async () => {
    const fake = fakeGateway(); fake.gateway.callbackSession = vi.fn(async () => ({ session, recovery: true }));
    fake.gateway.updatePassword = vi.fn().mockRejectedValue(new Error('private-provider-detail'));
    const { user } = setup('/auth/recovery', fake.gateway, { kind: 'recovery', hasCode: true, invalid: false });
    await user.type(await screen.findByLabelText('Nova senha'), 'new-test-password'); await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-test-password');
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir');
    expect(screen.getByLabelText('Nova senha')).toBeVisible(); expect(screen.queryByText('private-provider-detail')).not.toBeInTheDocument();
    expect(fake.gateway.logout).not.toHaveBeenCalled();
  });
  it('shows the recovery form when PASSWORD_RECOVERY established the session before callback fallback', async () => {
    const fake = fakeGateway(session); fake.gateway.callbackSession = vi.fn().mockRejectedValue(new Error('one-time token already consumed'));
    const { services } = setup('/auth/recovery', fake.gateway, { kind: 'recovery', hasCode: true, invalid: false });
    act(() => fake.emit('PASSWORD_RECOVERY', session));
    expect(await screen.findByLabelText('Nova senha')).toBeVisible();
    expect(services.auth.getSnapshot()).toMatchObject({ recovery: true, callback: 'success' });
    expect(fake.gateway.callbackSession).toHaveBeenCalledTimes(1);
  });
  it.each(['success', 'failure'] as const)('keeps callback loading until the SDK finishes: %s', async (outcome) => {
    const pending = deferred<CallbackSession>(); const fake = fakeGateway();
    fake.gateway.callbackSession = vi.fn(async () => {
      const result = await pending.promise;
      if (outcome === 'failure') throw new Error('exchange rejected');
      return result;
    });
    setup('/auth/recovery?code=mock', fake.gateway, { kind: 'recovery', hasCode: true, invalid: false });
    expect(screen.getByRole('status')).toHaveTextContent('Validando seu link');
    expect(screen.queryByText('Este link não está disponível.')).not.toBeInTheDocument();
    expect(fake.gateway.callbackSession).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ session, recovery: true }));
    if (outcome === 'success') expect(await screen.findByLabelText('Nova senha')).toBeVisible();
    else expect(await screen.findByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
    expect(fake.gateway.callbackSession).toHaveBeenCalledTimes(1);
  });
  it('accepts PASSWORD_RECOVERY during initialization with no code or local marker', async () => {
    const pending = deferred<CallbackSession>(); const fake = fakeGateway();
    fake.gateway.callbackSession = vi.fn(() => pending.promise);
    setup('/auth/recovery', fake.gateway, { kind: 'recovery', hasCode: false, invalid: false });
    expect(screen.getByRole('status')).toHaveTextContent('Validando seu link');
    act(() => fake.emit('PASSWORD_RECOVERY', session));
    expect(screen.queryByText('Este link não está disponível.')).not.toBeInTheDocument();
    await act(async () => pending.resolve({ session: null, recovery: false }));
    expect(await screen.findByLabelText('Nova senha')).toBeVisible();
  });
  it('restores the same-tab recovery form without code after callback completion', async () => {
    const previous = fakeGateway();
    const first = createServices(publicConfig(publicEnv), 'http://localhost:3101', null, previous.gateway);
    const stop = first.auth.start(); await first.auth.ready(); previous.emit('PASSWORD_RECOVERY', session); stop();
    setup('/auth/recovery', fakeGateway(session).gateway, { kind: 'recovery', hasCode: false, invalid: false });
    expect(await screen.findByLabelText('Nova senha')).toBeVisible();
  });
  it('rejects a callback with neither code nor recovery session only after initialization', async () => {
    const pending = deferred<CallbackSession>(); const fake = fakeGateway();
    fake.gateway.callbackSession = vi.fn(() => pending.promise);
    setup('/auth/recovery', fake.gateway, { kind: 'recovery', hasCode: false, invalid: false });
    expect(screen.getByRole('status')).toHaveTextContent('Validando seu link');
    expect(screen.queryByText('Este link não está disponível.')).not.toBeInTheDocument();
    await act(async () => pending.resolve({ session: null, recovery: false }));
    expect(await screen.findByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  });
});
