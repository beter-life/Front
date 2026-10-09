import { test, expect } from '@playwright/test';
import { uiuxBoundary, uiuxLogin } from './uiux-boundary';
import { bankAccount } from '../fixtures/cards';

const surfaces = [
  ['home', '/app'], ['finance', '/finance'], ['movements', '/finance/transactions'],
  ['budget', '/finance/budgets'], ['cards', '/finance/cards'], ['debts', '/finance/debts'],
  ['safe-spend', '/finance/safe-to-spend'], ['profile', '/profile'], ['login', '/login'],
] as const;

test('crimson representative visual audit', async ({ page }, info) => {
  test.setTimeout(120_000);
  const state = await uiuxBoundary(page, { movements: true }); await uiuxLogin(page);
  const stage = process.env.UIUX_CAPTURE_STAGE === 'before' ? 'before' : 'after';
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema').selectOption(theme);
      for (const [name, path] of surfaces) {
        // A fresh context makes the public login surface independent of the authenticated guard.
        if (name === 'login') continue;
        await page.goto(path); await expect(page.locator('#main h1')).toBeVisible();
        await expect(page.locator('[role="status"]')).toHaveCount(0);
        await page.screenshot({ path: `.harness/tmp/crimson/${stage}-${info.project.name}-${width}-${theme}-${name}.png`, fullPage: true, animations: 'disabled' });
      }
      if (width === 390) {
        await page.getByRole('button', { name: 'Mais, abrir menu completo' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.screenshot({ path: `.harness/tmp/crimson/${stage}-${info.project.name}-${width}-${theme}-menu.png`, fullPage: true, animations: 'disabled' });
        await page.keyboard.press('Escape');
      }
    }
  }
  expect(state.financialWrites).toBe(0); expect(state.errors).toEqual([]);
});

test('crimson computed identity, uniform fonts and financial semantic distinction', async ({ page }) => {
  await uiuxBoundary(page, { movements: true }); await uiuxLogin(page);
  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    await page.goto('/finance');
    const colors = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(['primary', 'expense', 'destructive', 'success'].map(key => [key, style.getPropertyValue('--' + key).trim()]));
    });
    expect(colors.primary).toBe(theme === 'light' ? '#b91c1c' : '#e05d5d');
    expect(new Set(Object.values(colors)).size).toBe(4);
    await expect(page.locator('.finance-balance')).toHaveCSS('font-family', '"Segoe UI", "Helvetica Neue", Arial, sans-serif');
    await expect(page.locator('.finance-balance')).toHaveCSS('font-variant-numeric', 'tabular-nums');
    await page.goto('/finance/transactions');
    for (const type of ['income', 'expense', 'transfer']) await expect(page.locator('.movement-row.' + type)).toBeVisible();
    await expect(page.locator('.movement-icon.expense')).not.toHaveCSS('color', await page.locator('.movement-icon.income').evaluate(e => getComputedStyle(e).color));
  }
});

test('crimson Home prioritizes four essential tools without invented metrics or writes', async ({ page }) => {
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  const essentials = page.getByRole('navigation', { name: 'Ferramentas essenciais' });
  await expect(essentials.getByRole('link')).toHaveCount(4);
  await expect(page.locator('.home-tool-group')).toHaveCount(3);
  await page.getByRole('link', { name: 'Novo movimento', exact: true }).click();
  await expect(page.getByLabel('Descrição', { exact: true })).toBeVisible();
  expect(state.financialWrites).toBe(0);
});

test('crimson form feedback and action placement remain stable before and after validation', async ({ page }, info) => {
  const state = await uiuxBoundary(page); await uiuxLogin(page); await page.goto('/profile');
  await page.getByLabel('Como prefere ser chamado?').fill('');
  const submit = page.getByRole('button', { name: 'Salvar perfil' });
  const documentY = () => submit.evaluate(e => e.getBoundingClientRect().top + scrollY);
  const before = await documentY();
  await page.screenshot({ path: `.harness/tmp/crimson/form-${info.project.name}-before.png`, fullPage: true, animations: 'disabled' });
  await submit.click(); await expect(page.locator('[aria-invalid="true"]')).toBeVisible();
  expect(Math.abs((await documentY()) - before)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: `.harness/tmp/crimson/form-${info.project.name}-after.png`, fullPage: true, animations: 'disabled' });
  expect(state.financialWrites).toBe(0);
});

test('crimson public login visual audit', async ({ page }, info) => {
  const stage = process.env.UIUX_CAPTURE_STAGE === 'before' ? 'before' : 'after';
  await uiuxBoundary(page);
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 960 }); await page.goto('/login');
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema').selectOption(theme);
      await page.screenshot({ path: `.harness/tmp/crimson/${stage}-${info.project.name}-${width}-${theme}-login.png`, fullPage: true, animations: 'disabled' });
    }
  }
});

test('crimson settings group accounts, reserve and planning without shifting actions or writing finance', async ({ page }, info) => {
  const state = await uiuxBoundary(page);
  await page.route('**/api/v1/finance/accounts', route => route.fulfill({ json: [bankAccount, { ...bankAccount, id: '99999999-9999-4999-8999-999999999999', name: 'Reserva', type: 'savings', balanceMinor: '10000' }] }));
  await uiuxLogin(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const theme of ['light', 'dark']) {
      await page.goto('/finance/safe-to-spend'); await page.getByLabel('Tema').selectOption(theme);
      await page.getByRole('button', { name: 'Editar configuração' }).click();
      const form = page.locator('.safe-settings');
      await expect(form.getByRole('group')).toHaveCount(4);
      await expect(form.locator('.safe-account-option')).toHaveCount(2);
      await expect(form.getByRole('checkbox', { name: bankAccount.name, exact: true })).toBeChecked();
      await expect(form.getByRole('checkbox', { name: 'Reserva', exact: true })).not.toBeChecked();
      expect(await form.evaluate(e => e.getBoundingClientRect().width)).toBeLessThanOrEqual(840);
      expect(await form.locator('.safe-buffer-field').evaluate(e => e.getBoundingClientRect().width)).toBeLessThanOrEqual(360);
      const save = form.getByRole('button', { name: 'Salvar configuração' });
      await expect(save).toHaveCSS('background-color', 'rgb(185, 28, 28)'); await expect(save).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(save).toHaveCSS('border-radius', '10px');
      const gap = await form.evaluate(e => e.querySelector('.safe-settings-actions')!.getBoundingClientRect().top - e.querySelector('.safe-settings-fields')!.getBoundingClientRect().bottom);
      expect(gap).toBeLessThanOrEqual(24);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.harness/tmp/crimson/settings-${info.project.name}-${width}-${theme}.png`, fullPage: true, animations: 'disabled' });
      await form.screenshot({ path: `.harness/tmp/crimson/settings-panel-${info.project.name}-${width}-${theme}.png`, animations: 'disabled', style: '.app-header, .mobile-navigation { visibility: hidden; }' });
      const y = () => save.evaluate(e => e.getBoundingClientRect().top + scrollY);
      const before = await y(), heightBefore = await form.evaluate(e => e.getBoundingClientRect().height);
      await form.getByRole('checkbox', { name: bankAccount.name, exact: true }).uncheck();
      await save.click(); await expect(form.getByRole('alert')).toBeVisible();
      expect(Math.abs(await y() - before)).toBeLessThanOrEqual(2);
      expect(await form.evaluate(e => e.getBoundingClientRect().height)).toBe(heightBefore);
      await form.getByRole('button', { name: 'Cancelar edição' }).click();
      await expect(form).toHaveCount(0);
    }
  }
  expect(state.financialWrites).toBe(0); expect(state.errors).toEqual([]);
});

test('crimson simplified sidebar, rail and deep-red actions use readable active text', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    const nav = page.getByRole('navigation', { name: 'Navegação principal' });
    await expect(nav.getByRole('button')).toHaveCount(2);
    await expect(nav.locator('.nav-primary a')).toHaveCount(7);
    const active = nav.locator('a.active');
    expect(await active.evaluate(e => getComputedStyle(e).color)).toBe(await page.locator('body').evaluate(e => getComputedStyle(e).color));
    const action = page.getByRole('link', { name: 'Novo movimento', exact: true });
    await expect(action).toHaveCSS('background-color', 'rgb(185, 28, 28)'); await expect(action).toHaveCSS('color', 'rgb(255, 255, 255)');
    await page.screenshot({ path: `.harness/tmp/crimson/sidebar-expanded-${info.project.name}-${theme}.png`, fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Recolher navegação' }).click();
    await expect(nav.getByRole('link', { name: 'Cartões' })).toHaveAttribute('title', 'Cartões');
    await page.screenshot({ path: `.harness/tmp/crimson/sidebar-rail-${info.project.name}-${theme}.png`, fullPage: true, animations: 'disabled' });
    await page.getByRole('button', { name: 'Expandir navegação' }).click();
  }
  expect(state.financialWrites).toBe(0);
});
