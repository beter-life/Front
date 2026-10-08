import { navigateFeature, logoutThroughAccount } from './navigation-helper';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function mockServices(page: Page, options: { loginFailure?: boolean; usedToken?: boolean; updateFailure?: boolean; existingProfile?: boolean; wrongProfileOwner?: boolean; enforcePassword?: boolean } = {}) {
  const owner = '11111111-1111-4111-8111-111111111111';
  const user = {
    id: owner, aud: 'authenticated', role: 'authenticated', email: 'test@example.test',
    email_confirmed_at: '2026-01-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, identities: [],
  };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const token = [encode({ alg: 'ES256', kid: 'synthetic' }), encode({ sub: owner, aud: 'authenticated', role: 'authenticated', exp: now + 3600, iat: now }), Buffer.from('synthetic-signature').toString('base64url')].join('.');
  const session = { access_token: token, refresh_token: 'synthetic-refresh', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user };
  let currentPassword = 'synthetic-password';
  let savedProfile = options.existingProfile ? {
    id: '33333333-3333-4333-8333-333333333333', displayName: 'Conta de Teste',
    locale: 'pt-BR', timezone: 'America/Sao_Paulo',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  } : null;
  const state = { logins: 0, loginEmailCurrent: false, signups: 0, signupRedirect: '', recoveries: 0, recoveryRedirect: '', verifications: 0, verificationType: '', updates: 0, logouts: 0, meReads: 0, profileWrites: 0 };
  const headers = { 'access-control-allow-origin': 'http://localhost:3103', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PUT,OPTIONS' };
  await page.route('**/auth/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.endsWith('/token')) {
      const body = request.postDataJSON() as { email?: string; password?: string };
      state.logins++;
      state.loginEmailCurrent = body.email === 'test@example.test';
      if (options.loginFailure || (options.enforcePassword && body.password !== currentPassword)) return route.fulfill({ status: 400, json: { code: 'invalid_credentials', message: 'Invalid login credentials' }, headers });
      return route.fulfill({ status: 200, json: session, headers });
    }
    if (url.pathname.endsWith('/signup')) {
      state.signups++;
      state.signupRedirect = url.searchParams.get('redirect_to') ?? '';
      return route.fulfill({ status: 200, json: { ...user, email_confirmed_at: null }, headers });
    }
    if (url.pathname.endsWith('/recover')) {
      state.recoveries++;
      state.recoveryRedirect = url.searchParams.get('redirect_to') ?? '';
      return route.fulfill({ status: 200, json: {}, headers });
    }
    if (url.pathname.endsWith('/verify')) {
      const body = request.postDataJSON() as { token_hash?: string; type?: string };
      state.verifications++;
      state.verificationType = body.type ?? '';
      if (options.usedToken || body.token_hash !== 'synthetic-hash') return route.fulfill({ status: 403, json: { code: 'otp_expired', message: 'Token invalid or used' }, headers });
      return route.fulfill({ status: 200, json: session, headers });
    }
    if (url.pathname.endsWith('/user') && request.method() === 'PUT') {
      state.updates++;
      if (options.updateFailure) return route.fulfill({ status: 422, json: { code: 'same_password', message: 'Password cannot be reused' }, headers });
      currentPassword = (request.postDataJSON() as { password: string }).password;
      return route.fulfill({ status: 200, json: user, headers });
    }
    if (url.pathname.endsWith('/user') && request.method() === 'GET') return route.fulfill({ status: 200, json: user, headers });
    if (url.pathname.endsWith('/logout')) { state.logouts++; return route.fulfill({ status: 200, json: {}, headers }); }
    return route.fulfill({ status: 200, json: {}, headers });
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    expect(request.headers().authorization).toBe(`Bearer ${token}`);
    if(request.method()==='PUT') {
      expect(new URL(request.url()).pathname).toBe('/api/v1/me/profile');
      const body=request.postDataJSON() as { displayName: string; locale: string; timezone: string };
      expect(Object.keys(body).sort()).toEqual(['displayName','locale','timezone']);
      savedProfile = { ...body, id: '33333333-3333-4333-8333-333333333333', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
      state.profileWrites++;
      return route.fulfill({status:200,json:savedProfile,headers});
    }
    state.meReads++;
    expect(new URL(request.url()).pathname).toBe('/api/v1/me');
    await route.fulfill({ status: 200, json: {
      identity: { authUserId: options.wrongProfileOwner ? '22222222-2222-4222-8222-222222222222' : owner },
      profile: savedProfile,
    }, headers });
  });
  return state;
}

test('new SDK login opens the protected /me route and logout blocks it', async ({ page }) => {
  const state = await mockServices(page);
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
  await page.getByLabel('E-mail').fill('  TeSt@Example.Test  ');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Seu espaço começa com você.' })).toBeVisible();
  expect(state.logins).toBe(1);
  expect(state.loginEmailCurrent).toBe(true);
  expect(state.meReads).toBeGreaterThan(0);
  await logoutThroughAccount(page);
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui.' })).toBeVisible();
  expect(state.logouts).toBe(1);
  await page.goto('/app');
  await expect(page).toHaveURL('http://localhost:3103/login');
});

test('wrong password and unknown user share one sanitized error', async ({ page }) => {
  const state = await mockServices(page, { loginFailure: true });
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  const wrongPasswordMessage = await page.getByRole('alert').innerText();
  await page.getByLabel('E-mail').fill('missing@example.test');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect.poll(() => state.logins).toBe(2);
  await expect(page.getByRole('alert')).toHaveText(wrongPasswordMessage);
  expect(wrongPasswordMessage).not.toContain('Invalid login credentials');
});

test('an existing profile appears from GET /me only for its authenticated owner', async ({ page }) => {
  const state = await mockServices(page, { existingProfile: true });
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Bom ter você aqui, Conta de Teste.' })).toBeVisible();
  expect(state.meReads).toBeGreaterThan(0);
});

test('a mismatched /me identity never displays another account profile', async ({ page }) => {
  await mockServices(page, { existingProfile: true, wrongProfileOwner: true });
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByText('Não foi possível carregar seu perfil. Sua sessão continua protegida.')).toBeVisible();
  await expect(page.getByText('Conta de Teste')).toHaveCount(0);
});

test('signup uses same-origin confirmation and displays only neutral delivery text', async ({ page }) => {
  const state = await mockServices(page);
  await page.goto('/signup');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password');
  await page.getByLabel('Confirmar senha').fill('synthetic-password');
  await page.getByRole('button', { name: 'Criar minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Falta só confirmar.' })).toBeVisible();
  expect(state.signups).toBe(1);
  expect(state.signupRedirect).toBe('http://localhost:3103/auth/confirm');
  await expect(page.getByText(/entrega do e-mail/)).toBeVisible();
});

test('signup TokenHash is verified once and removed from the URL', async ({ page }) => {
  const state = await mockServices(page);
  await page.goto('/auth/confirm?token_hash=synthetic-hash&type=email');
  await expect(page.getByRole('heading', { name: 'E-mail confirmado.' })).toBeVisible();
  expect(state.verifications).toBe(1);
  expect(state.verificationType).toBe('email');
  expect(new URL(page.url()).searchParams.has('token_hash')).toBe(false);
});

test('a used signup TokenHash cannot open the confirmed state', async ({ page }) => {
  const state = await mockServices(page, { usedToken: true });
  await page.goto('/auth/confirm?token_hash=synthetic-hash&type=email');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  expect(state.verifications).toBe(1);
});

test('recovery is single and neutral; the recovered password permits a new login', async ({ page }) => {
  const messages: string[] = [];
  page.on('console',message=>messages.push(message.text()));
  const state = await mockServices(page, { enforcePassword: true });
  await page.goto('/forgot-password');
  await page.getByLabel('E-mail').fill('  TeSt@Example.Test  ');
  await page.getByLabel('E-mail').press('Enter');
  await expect(page.getByRole('heading', { name: 'Solicitação recebida.' })).toBeVisible();
  expect(state.recoveries).toBe(1);
  expect(state.recoveryRedirect).toBe('http://localhost:3103/auth/recovery');
  await page.goto('/auth/recovery?token_hash=synthetic-hash&type=recovery');
  await expect(page.getByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
  expect(state.verifications).toBe(1);
  expect(state.verificationType).toBe('recovery');
  expect(new URL(page.url()).searchParams.has('token_hash')).toBe(false);
  await page.getByLabel('Nova senha', { exact: true }).fill('new-synthetic-password');
  await page.getByLabel('Confirmar nova senha').fill('new-synthetic-password');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByText('Senha atualizada. Entre com sua nova senha.')).toBeVisible();
  expect(state.updates).toBe(1);
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('new-synthetic-password');
  await page.getByRole('button', { name: 'Entrar na minha conta' }).click();
  await expect(page.getByRole('heading', { name: 'Seu espaço começa com você.' })).toBeVisible();
  expect(state.logins).toBe(1);
  expect(messages.join('\n')).not.toMatch(/synthetic-hash|new-synthetic-password|synthetic-refresh|eyJ[\w-]+\.[\w-]+\.[\w-]+/);
});

test('invalid recovery token and failed update do not claim success', async ({ page }) => {
  const state = await mockServices(page, { updateFailure: true });
  await page.goto('/auth/recovery?token_hash=invalid&type=recovery');
  await expect(page.getByRole('heading', { name: 'Este link não está disponível.' })).toBeVisible();
  expect(state.verifications).toBe(1);
  await page.goto('/auth/recovery?token_hash=synthetic-hash&type=recovery');
  await expect(page.getByRole('heading', { name: 'Uma nova senha.' })).toBeVisible();
  await page.getByLabel('Nova senha', { exact: true }).fill('new-synthetic-password');
  await page.getByLabel('Confirmar nova senha').fill('new-synthetic-password');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByText('Não foi possível atualizar a senha. Tente novamente.')).toBeVisible();
  expect(state.updates).toBe(1);
});

test('profile persists through reload and logout removes protected access', async ({ page }) => {
  const state=await mockServices(page);
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha', {exact:true}).fill('synthetic-password');
  await page.getByRole('button',{name:'Entrar na minha conta'}).click();
  await navigateFeature(page, 'Meu perfil');
  await page.getByLabel('Como prefere ser chamado?').fill('Perfil persistido');
  await page.getByRole('button',{name:'Salvar perfil'}).click();
  await expect(page.getByText('Perfil salvo. Tudo do seu jeito.')).toBeVisible();
  expect(state.profileWrites).toBe(1);
  await page.reload();
  await expect(page.getByLabel('Como prefere ser chamado?')).toHaveValue('Perfil persistido');
  expect(state.logins).toBe(1);
  await logoutThroughAccount(page);
  await expect(page).toHaveURL('http://localhost:3103/login');
  await page.goto('/profile');
  await expect(page).toHaveURL('http://localhost:3103/login');
  await page.goto('/account/password');
  await expect(page).toHaveURL('http://localhost:3103/login');
});

test('authenticated password change preserves the session and allows login with the new password', async ({ page }) => {
  const state=await mockServices(page,{enforcePassword:true});
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha',{exact:true}).fill('synthetic-password');
  await page.getByRole('button',{name:'Entrar na minha conta'}).click();
  await navigateFeature(page, 'Segurança');
  await page.getByLabel('Nova senha',{exact:true}).fill('authenticated-new-password');
  await page.getByLabel('Confirmar nova senha').fill('authenticated-new-password');
  await page.getByRole('button',{name:'Salvar nova senha'}).click();
  await expect(page.getByText('Senha atualizada.',{exact:true})).toBeVisible();
  expect(state.updates).toBe(1);
  expect(state.logouts).toBe(0);
  await logoutThroughAccount(page);
  await page.getByLabel('E-mail').fill('test@example.test');
  await page.getByLabel('Senha',{exact:true}).fill('authenticated-new-password');
  await page.getByRole('button',{name:'Entrar na minha conta'}).click();
  await expect(page.getByRole('heading',{name:'Seu espaço começa com você.'})).toBeVisible();
  expect(state.logins).toBe(2);
});
