import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function mockExternal(page: Page, options: { tokenResponse?: Promise<void>; rejectCode?: boolean } = {}) {
  const owner = '11111111-1111-4111-8111-111111111111';
  const user = { id: owner, aud: 'authenticated', role: 'authenticated', email: 'test@example.test', email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [] };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const token = [encode({ alg: 'ES256', kid: 'test-key' }), encode({ sub: owner, aud: 'authenticated', role: 'authenticated', exp: now + 3600, iat: now }), Buffer.from('mock-signature').toString('base64url')].join('.');
  const session = { access_token: token, refresh_token: 'mock-refresh', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user };
  const state = { signupRedirect: '', recoveryRedirect: '', passwordUpdated: false, loggedOut: false, tokenRequests: 0, pkceMatched: false };
  let challenge: string | undefined;
  let profile: Record<string, unknown> | null = null;
  const headers = { 'access-control-allow-origin': 'http://localhost:3101', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    let body: unknown = {};
    if (url.pathname.endsWith('/token')) {
      state.tokenRequests++;
      if (url.searchParams.get('grant_type') === 'pkce') {
        const input = request.postDataJSON() as { code_verifier?: string };
        state.pkceMatched = !!input.code_verifier && createHash('sha256').update(input.code_verifier).digest('base64url') === challenge;
        await options.tokenResponse;
        if (options.rejectCode || !state.pkceMatched) return route.fulfill({ status: 400, json: { code: 'bad_code_verifier', message: 'Mock PKCE exchange rejected' }, headers });
      }
      body = session;
    }
    if (url.pathname.endsWith('/signup')) { challenge = request.postDataJSON().code_challenge; state.signupRedirect = url.searchParams.get('redirect_to') ?? ''; body = { ...user, email_confirmed_at: null, confirmation_sent_at: '2026-01-01T00:00:00Z' }; }
    if (url.pathname.endsWith('/recover')) { challenge = request.postDataJSON().code_challenge; state.recoveryRedirect = url.searchParams.get('redirect_to') ?? ''; }
    if (url.pathname.endsWith('/user')) { state.passwordUpdated = request.method() === 'PUT'; body = user; }
    if (url.pathname.endsWith('/logout')) state.loggedOut = true;
    await route.fulfill({ status: 200, json: body, headers });
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(Boolean(request.headers().authorization?.startsWith('Bearer '))).toBe(true);
    if (request.method() === 'PUT') {
      const input = request.postDataJSON() as Record<string, unknown>;
      expect(Object.keys(input).sort()).toEqual(['displayName', 'locale', 'timezone']);
      profile = { ...input, id: '33333333-3333-4333-8333-333333333333', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
      return route.fulfill({ json: profile, headers });
    }
    await route.fulfill({ json: { identity: { authUserId: owner }, profile }, headers });
  });
  return state;
}
test('protected access, keyboard validation, login, profile and logout', async ({ page }, info) => {
  await mockExternal(page); await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
  await mkdir('.harness/tmp', { recursive: true });
  await page.screenshot({ path: '.harness/tmp/login-' + info.project.name + '.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeFocused();
  await page.getByLabel('E-mail').fill('test@example.test'); await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await page.getByRole('link', { name: 'Meu perfil', exact: true }).click();
  await page.getByLabel('Como prefere ser chamado?').fill('Ana');
  await page.getByLabel('Fuso horário').fill('America/Sao_Paulo');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await page.getByRole('link', { name: 'Voltar ao início' }).click();
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui, Ana.' })).toBeVisible();
  await page.screenshot({ path: '.harness/tmp/home-' + info.project.name + '.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
  await page.goto('/app'); await expect(page.getByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
});
test('real browser SDK completes mocked signup PKCE confirmation', async ({ page }) => {
  const state = await mockExternal(page); await page.goto('/signup');
  await page.getByLabel('E-mail').fill('test@example.test'); await page.getByLabel('Senha', { exact: true }).fill('test-password'); await page.getByLabel('Confirmar senha').fill('test-password');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Falta só confirmar.' })).toBeVisible();
  expect(state.signupRedirect).toBe('http://localhost:3101/auth/confirm');
  const callback = new URL(state.signupRedirect); callback.searchParams.set('code', 'mock-confirmation-code');
  expect(callback.origin).toBe('http://localhost:3101');
  await page.goto(callback.toString());
  await expect(page.getByRole('heading', { name: 'E-mail confirmado.' })).toBeVisible(); expect(new URL(page.url()).search).toBe('');
});
test('real browser SDK separates mocked recovery PKCE from login', async ({ page }) => {
  let releaseToken!: () => void;
  const tokenResponse = new Promise<void>((resolve) => { releaseToken = resolve; });
  const state = await mockExternal(page, { tokenResponse }); await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('test@example.test'); await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'O próximo passo está no seu e-mail.' })).toBeVisible();
  expect(state.recoveryRedirect).toBe('http://localhost:3101/auth/recovery');
  expect(state.recoveryRedirect).not.toContain('localhost:3000');
  const callback = new URL(state.recoveryRedirect); callback.searchParams.set('code', 'mock-recovery-code'); await page.goto(callback.toString());
  expect(new URL(page.url()).origin).toBe('http://localhost:3101');
  await expect.poll(() => state.tokenRequests).toBe(1);
  await expect(page.getByRole('status')).toContainText('Validando seu link');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has('code')).toBe(true);
  releaseToken();
  await expect(page.getByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
  expect(state.pkceMatched).toBe(true);
  expect(new URL(page.url()).searchParams.has('code')).toBe(false);
  expect(state.tokenRequests).toBe(1);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
  expect(state.tokenRequests).toBe(1);
  await page.getByLabel('Nova senha', { exact: true }).fill('new-test-password'); await page.getByLabel('Confirmar nova senha').fill('new-test-password'); await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible(); expect(state.passwordUpdated).toBe(true); expect(state.loggedOut).toBe(true);
});
test('expired callback never opens password form', async ({ page }) => {
  await mockExternal(page); await page.goto('/auth/recovery?error=access_denied&error_description=untrusted');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible(); await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has('error')).toBe(true);
});
test('failed automatic exchange waits before invalid and is never retried manually', async ({ page }) => {
  let releaseToken!: () => void;
  const tokenResponse = new Promise<void>((resolve) => { releaseToken = resolve; });
  const state = await mockExternal(page, { tokenResponse, rejectCode: true });
  await page.goto('/forgot-password'); await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'O próximo passo está no seu e-mail.' })).toBeVisible();
  const callback = new URL(state.recoveryRedirect); callback.searchParams.set('code', 'mock-rejected-code');
  await page.goto(callback.toString());
  await expect.poll(() => state.tokenRequests).toBe(1);
  await expect(page.getByRole('status')).toContainText('Validando seu link');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toHaveCount(0);
  releaseToken();
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  expect(state.tokenRequests).toBe(1); expect(new URL(page.url()).searchParams.has('code')).toBe(true);
});
test('code without originating verifier produces no token request and no recovery session', async ({ page }) => {
  const state = await mockExternal(page);
  await page.goto('/auth/recovery?code=mock-without-verifier');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  expect(state.tokenRequests).toBe(0);
});
