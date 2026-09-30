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
  const state = { storageKey: '', signupRedirect: '', recoveryRedirect: '', recoveryRequests: 0, recoveryEmailIsCurrent: false, passwordUpdated: false, loggedOut: false, tokenRequests: 0, pkceMatched: false };
  let challenge: string | undefined;
  let profile: Record<string, unknown> | null = null;
  const headers = { 'access-control-allow-origin': 'http://localhost:3101', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request(); const url = new URL(request.url());
    state.storageKey = `sb-${url.hostname.split('.')[0]}-auth-token`;
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
    if (url.pathname.endsWith('/recover')) {
      const input = request.postDataJSON() as { code_challenge?: string; email?: string };
      challenge = input.code_challenge;
      state.recoveryRequests++;
      state.recoveryEmailIsCurrent = input.email === 'test@example.test';
      state.recoveryRedirect = url.searchParams.get('redirect_to') ?? '';
    }
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

// Inspect actual browser storage using the real SDK, but return only booleans.
// Auth transport is mocked: this is not evidence of live Supabase delivery.
async function verifierPresence(page: Page, storageKey: string) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key + '-code-verifier');
    let parsed: unknown;
    try { parsed = raw === null ? null : JSON.parse(raw); } catch { parsed = null; }
    return {
      local: typeof parsed === 'string' && !!parsed.split('/')[0],
      session: window.sessionStorage.getItem(key + '-code-verifier') !== null,
    };
  }, storageKey);
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
test('real SDK persists verifier across request/callback and manual exchange runs once', async ({ page }) => {
  let releaseToken!: () => void;
  const tokenResponse = new Promise<void>((resolve) => { releaseToken = resolve; });
  const state = await mockExternal(page, { tokenResponse }); await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('test@example.test'); await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitação recebida.' })).toBeVisible();
  expect(state.recoveryRedirect).toBe('http://localhost:3101/auth/recovery');
  expect(state.recoveryRedirect).not.toContain('localhost:3000');
  const requestStorageKey = state.storageKey;
  expect(await verifierPresence(page, requestStorageKey)).toEqual({ local: true, session: false });
  const callback = new URL(state.recoveryRedirect); callback.searchParams.set('code', 'mock-recovery-code'); await page.goto(callback.toString());
  expect(new URL(page.url()).origin).toBe('http://localhost:3101');
  await expect.poll(() => state.tokenRequests).toBe(1);
  await expect(page.getByRole('status')).toContainText('Validando seu link');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has('code')).toBe(true);
  expect(state.storageKey).toBe(requestStorageKey);
  expect(await verifierPresence(page, requestStorageKey)).toEqual({ local: true, session: false });
  expect(state.loggedOut).toBe(false);
  releaseToken();
  await expect(page.getByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
  expect(state.pkceMatched).toBe(true);
  expect(new URL(page.url()).searchParams.has('code')).toBe(false);
  expect(state.tokenRequests).toBe(1);
  expect(await verifierPresence(page, requestStorageKey)).toEqual({ local: false, session: false });
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
test('retry link only navigates; the latest autofilled or edited address is normalized for one recover request', async ({ page }) => {
  const state = await mockExternal(page);
  await page.goto('/auth/recovery?error=access_denied');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  await page.getByRole('link', { name: 'Solicitar outro link' }).click();
  await expect(page).toHaveURL('http://localhost:3101/forgot-password');
  expect(state.recoveryRequests).toBe(0);
  const email = page.getByLabel('E-mail');
  await expect(email).toHaveValue('');
  await email.fill('outdated@example.test');
  await email.fill('  TeSt@Example.Test  ');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitação recebida.' })).toBeVisible();
  expect(state.recoveryRequests).toBe(1);
  expect(state.recoveryEmailIsCurrent).toBe(true);
});
test('failed manual exchange waits before invalid and is never retried', async ({ page }) => {
  let releaseToken!: () => void;
  const tokenResponse = new Promise<void>((resolve) => { releaseToken = resolve; });
  const state = await mockExternal(page, { tokenResponse, rejectCode: true });
  await page.goto('/forgot-password'); await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitação recebida.' })).toBeVisible();
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
  const diagnostics: string[] = [];
  page.on('console', async (message) => {
    if (!message.text().startsWith('[auth-callback]')) return;
    const code = await message.args()[1]?.evaluate((value: { errorCode?: string }) => value.errorCode);
    if (code) diagnostics.push(code);
  });
  const state = await mockExternal(page);
  await page.goto('/auth/recovery?code=mock-without-verifier');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  await expect(page.getByLabel('Nova senha', { exact: true })).toHaveCount(0);
  expect(state.tokenRequests).toBe(0);
  await expect.poll(() => diagnostics.includes('PKCE_VERIFIER_MISSING')).toBe(true);
});

test('manual exchange beats invalid-session cleanup in real SDK', async ({ page }) => {
  let releaseToken!: () => void;
  const tokenResponse = new Promise<void>((resolve) => { releaseToken = resolve; });
  const diagnostics: Array<{ skipped?: boolean; before?: boolean; started?: boolean; succeeded?: boolean; session?: boolean }> = [];
  page.on('console', async (message) => {
    if (!message.text().startsWith('[auth-callback]')) return;
    const diagnostic = await message.args()[1]?.evaluate((value: {
      autoInitializeSkipped?: boolean; verifierPresentBeforeExchange?: boolean;
      exchangeStarted?: boolean; exchangeSucceeded?: boolean; sessionPresentAfterExchange?: boolean;
    }) => ({ skipped: value.autoInitializeSkipped, before: value.verifierPresentBeforeExchange,
      started: value.exchangeStarted, succeeded: value.exchangeSucceeded, session: value.sessionPresentAfterExchange }));
    if (diagnostic) diagnostics.push(diagnostic);
  });
  const state = await mockExternal(page, { tokenResponse });
  await page.goto('/forgot-password'); await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByRole('button', { name: 'Enviar link de recuperação' }).click();
  await expect(page.getByRole('heading', { name: 'Solicitação recebida.' })).toBeVisible();
  expect(await verifierPresence(page, state.storageKey)).toEqual({ local: true, session: false });
  // Synthetic corrupt session, not a real user's state.
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ invalidTestSession: true })), state.storageKey);
  const callback = new URL(state.recoveryRedirect); callback.searchParams.set('code', 'mock-bootstrap-code');
  await page.goto(callback.toString());
  await expect.poll(() => state.tokenRequests).toBe(1);
  await expect(page.getByRole('status')).toContainText('Validando seu link');
  expect(new URL(page.url()).searchParams.has('code')).toBe(true);
  expect(await verifierPresence(page, state.storageKey)).toEqual({ local: true, session: false });
  expect(await page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored !== null && JSON.parse(stored).invalidTestSession === true;
  }, state.storageKey)).toBe(true);
  await expect.poll(() => diagnostics.some((item) => item.skipped && item.before && item.started)).toBe(true);
  releaseToken();
  await expect(page.getByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
  await expect.poll(() => diagnostics.some((item) => item.succeeded && item.session)).toBe(true);
  expect(state.tokenRequests).toBe(1);
  expect(state.pkceMatched).toBe(true);
  expect(new URL(page.url()).searchParams.has('code')).toBe(false);
  expect(await verifierPresence(page, state.storageKey)).toEqual({ local: false, session: false });
});

test('inverse order reproduces old SDK verifier loss before network request', async ({ page }) => {
  await page.goto('/forgot-password');
  const facts = await page.evaluate(async () => {
    const probePath = '/tests/e2e/legacy-pkce-probe.ts';
    const { reproduceLegacyBootstrap } = await import(probePath);
    return reproduceLegacyBootstrap();
  });
  expect(facts).toEqual({ verifierBefore: true, verifierAfterInitialize: false,
    errorCode: 'pkce_code_verifier_not_found', tokenRequests: 0 });
});
