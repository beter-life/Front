import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { AppProviders } from '../../src/app/providers';
import { createServices } from '../../src/app/services';
import { publicConfig } from '../../src/config/env';
import { AppRoutes } from '../../src/routing/routes';
import type { AuthCallback } from '../../src/auth/callback';
import type { AuthGateway } from '../../src/auth/gateway';
import { deferred, fakeGateway, input, owner, profile, publicEnv, session } from '../helpers';

function setup(path: string, gateway: AuthGateway = fakeGateway().gateway, callback: AuthCallback | null = null, fetcher?: typeof fetch) {
  let stored: typeof profile | null = null;
  const external = fetcher ?? vi.fn<typeof fetch>(async (_url, init) => {
    if (init?.method === 'PUT') { stored = { ...profile, ...JSON.parse(init.body as string) }; return new Response(JSON.stringify(stored)); }
    return new Response(JSON.stringify({ identity: { authUserId: owner }, profile: stored }));
  });
  const services = createServices(publicConfig(publicEnv), 'http://localhost:3000', callback, gateway, external);
  render(<AppProviders services={services}><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></AppProviders>);
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
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockImplementation(async () => new Response(JSON.stringify({ identity: { authUserId: owner }, profile: null })));
    const { user } = setup('/app', fakeGateway(session).gateway, null, fetcher);
    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' })); expect(await screen.findByRole('link', { name: 'Completar meu perfil' })).toBeVisible();
  });
  it('handles confirmation success and expired callback separately', async () => {
    const { services } = setup('/auth/confirm', fakeGateway().gateway, { kind: 'confirmation', code: 'test-code', invalid: false });
    expect(await screen.findByRole('heading', { name: 'E-mail confirmado.' })).toBeVisible(); expect(services.auth.getSnapshot().status).toBe('authenticated');
  });
  it('rejects invalid confirmation without trusting URL error text', async () => {
    setup('/auth/confirm', fakeGateway().gateway, { kind: 'confirmation', invalid: true });
    expect(await screen.findByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  });
  it('requests recovery with neutral response', async () => {
    const fake = fakeGateway(); const { user } = setup('/forgot-password', fake.gateway);
    await user.type(screen.getByLabelText('E-mail'), 'test@example.test'); await user.click(screen.getByRole('button', { name: 'Enviar link de recuperação' }));
    expect(await screen.findByRole('heading', { name: 'O próximo passo está no seu e-mail.' })).toBeVisible(); expect(fake.gateway.recover).toHaveBeenCalledWith('test@example.test');
  });
  it('requires recovery session to update password and returns to login after success', async () => {
    const fake = fakeGateway(); fake.gateway.exchange = vi.fn(async () => ({ session, recovery: true }));
    const { user } = setup('/auth/recovery', fake.gateway, { kind: 'recovery', code: 'test-code', invalid: false });
    await user.type(await screen.findByLabelText('Nova senha'), 'new-test-password'); await user.type(screen.getByLabelText('Confirmar nova senha'), 'new-test-password'); await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
    expect(await screen.findByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible(); expect(fake.gateway.updatePassword).toHaveBeenCalledWith('new-test-password'); expect(fake.gateway.logout).toHaveBeenCalled();
  });
});
