import { test, expect } from '@playwright/test';
import { navigationItems } from '../../src/navigation/navigation-config';
import { cardFixture } from '../fixtures/cards';
import { debtFixture } from '../fixtures/debts';
import { goalFixture } from '../fixtures/goals';
import { navigateFeature, logoutThroughAccount } from './navigation-helper';
import { uiuxBoundary, uiuxLogin } from './uiux-boundary';

test('all protected destinations and detail deep links survive reload without data writes', async ({ page }) => {
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  for (const path of [...navigationItems.map(item => item.path), '/finance/cards/' + cardFixture.id, '/finance/debts/' + debtFixture.id, '/finance/goals/' + goalFixture().id]) {
    await page.goto(path); await expect(page.locator('#main h1')).toBeVisible();
    await expect(page.getByText('Esse caminho não existe.')).toHaveCount(0);
    await expect(page.locator('.finance-nav')).toHaveCount(0);
    await page.reload(); await expect(page.locator('#main h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(state.financialWrites).toBe(0); expect(state.errors).toEqual([]);
});
test('discover Cards → Movements → Budget → Safe to Spend → Debt → Goals → Profile', async ({ page }) => {
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  for (const name of ['Cartões', 'Movimentos', 'Orçamento', 'Quanto posso gastar?', 'Dívidas']) await navigateFeature(page, name);
  await page.getByRole('link', { name: 'Abrir dívida — Dívida teste' }).click();
  await expect(page.getByRole('navigation', { name: 'Caminho da página' }).getByText('Detalhes')).toBeVisible();
  await page.getByRole('navigation', { name: 'Caminho da página' }).getByRole('link', { name: 'Dívidas' }).click();
  await navigateFeature(page, 'Metas'); await navigateFeature(page, 'Meu perfil');
  await page.goBack(); await expect(page).toHaveURL(/\/finance\/goals$/);
  await page.goForward(); await expect(page).toHaveURL(/\/profile$/);
  expect(state.financialWrites).toBe(0);
});
test('search aliases, keyboard selection, empty results, shortcut editing exclusion and focus restore', async ({ page }) => {
  await uiuxBoundary(page); await uiuxLogin(page);
  const trigger = page.getByRole('button', { name: 'Buscar páginas' }); await trigger.focus(); await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox', { name: 'Para onde você quer ir?' }); await expect(input).toBeFocused();
  await input.fill('fatura'); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/finance\/cards$/);
  await trigger.click(); await input.fill('does-not-exist'); await expect(page.getByText('Nenhuma página encontrada. Tente outro termo.')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
  await trigger.click(); await input.fill('gasto'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/finance\/safe-to-spend$/);
  await page.goto('/profile'); await page.getByLabel('Como prefere ser chamado?').focus(); await page.keyboard.press('Control+k'); await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('mobile drawer closes via Escape/backdrop/navigation and contains focus; desktop rail retains accessible names', async ({ page }) => {
  await uiuxBoundary(page); await uiuxLogin(page);
  if (await page.getByRole('button', { name: 'Mais, abrir menu completo' }).isVisible()) {
    const trigger = page.getByRole('button', { name: 'Mais, abrir menu completo' }); await trigger.click();
    const drawer = page.getByRole('dialog', { name: 'Todas as ferramentas' }); await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('link', { name: 'Rendimentos' })).toBeVisible();
    await drawer.getByRole('button', { name: 'Sair da conta' }).focus(); await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null || document.activeElement === document.body)).toBe(true);
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await trigger.click(); await page.mouse.click(1, 1); await expect(drawer).toHaveCount(0);
    await trigger.click(); await drawer.getByRole('link', { name: 'Cartões', exact: true }).click(); await expect(drawer).toHaveCount(0);
  } else {
    await page.getByRole('button', { name: 'Recolher navegação' }).click();
    const link = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Cartões' });
    await link.focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/finance\/cards$/); await expect(link).toHaveAttribute('aria-current', 'page');
    await page.reload(); await expect(page.getByRole('button', { name: 'Expandir navegação' })).toBeVisible();
  }
});
test('quick actions open real editors directly; edits and validation feedback keep layout stable', async ({ page }) => {
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  for (const [action, field] of [['Novo movimento', 'Descrição'], ['Nova conta', 'Nome da conta'], ['Novo cartão', 'Nome do cartão'], ['Nova meta', 'Nome']]) {
    await page.goto('/app'); await page.getByRole('link', { name: action, exact: true }).click(); await expect(page.getByLabel(field!, { exact: true })).toBeVisible();
  }
  await page.goto('/profile'); const button = page.getByRole('button', { name: 'Salvar perfil' });
  const documentTop = () => button.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
  await page.getByLabel('Como prefere ser chamado?').fill(''); const before = await documentTop();
  await button.click(); await expect(page.locator('[aria-invalid="true"]').first()).toBeVisible(); const after = await documentTop();
  expect(Math.abs(after - before)).toBeLessThanOrEqual(2); expect(state.financialWrites).toBe(0);
});
test('Light/Dark/System are persistent on public/private pages and OS updates live', async ({ page }) => {
  await uiuxBoundary(page); await page.emulateMedia({ colorScheme: 'dark' }); await page.goto('/login');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark'); await page.getByLabel('Tema').selectOption('light');
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByLabel('Tema').selectOption('dark');
  for (const path of ['/signup', '/forgot-password', '/auth/recovery']) {
    await page.goto(path); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#main h1')).toBeVisible();
  }
  await page.getByLabel('Tema').selectOption('system'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' }); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await uiuxLogin(page); await page.getByLabel('Tema').selectOption('dark'); await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await logoutThroughAccount(page); await expect(page).toHaveURL(/\/login$/); await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/finance/cards'); await expect(page).toHaveURL(/\/login$/);
});
for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test('visual reflow and reachable actions at ' + width, async ({ page }, info) => {
    const state = await uiuxBoundary(page); await page.setViewportSize({ width, height: 960 }); await uiuxLogin(page);
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema').selectOption(theme);
      for (const path of ['/app', '/finance', '/finance/cards/' + cardFixture.id, '/finance/debts/' + debtFixture.id, '/finance/budgets', '/finance/safe-to-spend', '/profile']) {
        await page.goto(path); await expect(page.locator('#main h1')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Buscar páginas' })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
        await page.screenshot({ path: '.harness/tmp/uiux-' + info.project.name + '-' + width + '-' + theme + '-' + path.split('/').slice(1, 3).join('-') + '.png', fullPage: true });
      }
    }
    expect(state.financialWrites).toBe(0); expect(state.errors).toEqual([]);
  });
}
test('200 percent reflow and reduced motion keep navigation and controls available', async ({ page }) => {
  await uiuxBoundary(page); await uiuxLogin(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width: 720, height: 480 });
  await expect(page.getByRole('button', { name: 'Mais, abrir menu completo' })).toBeVisible();
  await page.getByRole('button', { name: 'Mais, abrir menu completo' }).click(); await expect(page.getByRole('dialog').getByRole('link', { name: 'Cartões' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('baseline before screenshots are reproducible without production session/data', async ({ page }, info) => {
  test.skip(!process.env.UIUX_BASELINE_URL, 'Optional local pre-change comparison server; new width/theme screenshots always run.');
  await uiuxBoundary(page); await uiuxLogin(page, process.env.UIUX_BASELINE_URL);
  for (const width of [390, 1440]) { await page.setViewportSize({ width, height: 960 }); for (const path of ['/app', '/finance']) { await page.goto(process.env.UIUX_BASELINE_URL + path); await page.screenshot({ path: '.harness/tmp/uiux-before-' + info.project.name + '-' + width + '-' + path.slice(1) + '.png', fullPage: true }); } }
});
