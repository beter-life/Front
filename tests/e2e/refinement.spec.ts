import { test, expect } from '@playwright/test';
import { navigationItems } from '../../src/navigation/navigation-config';
import { uiuxBoundary, uiuxLogin } from './uiux-boundary';
import { cardFixture } from '../fixtures/cards';
import { debtFixture } from '../fixtures/debts';
import { goalFixture } from '../fixtures/goals';

const destinations = [
  ...navigationItems.map(item => [item.id, item.path]),
  ['card-detail', '/finance/cards/' + cardFixture.id],
  ['debt-detail', '/finance/debts/' + debtFixture.id],
  ['goal-detail', '/finance/goals/' + goalFixture().id],
];
const formFamilies = [
  ['accounts', '/finance/accounts?action=create', ''],
  ['movements', '/finance/transactions?action=create', ''],
  ['goals', '/finance/goals?action=create', ''],
  ['recurrences', '/finance/recurrences', 'Nova recorrência'],
  ['net-worth', '/finance/net-worth', 'Novo item'],
  ['yield', '/finance/yield', 'Configurar rendimento'],
  ['cards', '/finance/cards?action=create', ''],
  ['debts', '/finance/debts', 'Nova dívida'],
  ['safe-settings', '/finance/safe-to-spend', 'Editar configuração'],
];
async function ready(page: import('@playwright/test').Page, path: string) {
  await page.goto(path);
  await expect(page.locator('#main h1')).toBeVisible();
  await expect(page.locator('#main').getByText(/^(Carregando|Calculando|Buscando)/)).toHaveCount(0);
}

test('complete visual inventory of destinations and form families without financial writes', async ({ page }, info) => {
  test.setTimeout(180_000);
  const state = await uiuxBoundary(page, { movements: true }); await uiuxLogin(page);
  const stage = process.env.UIUX_CAPTURE_STAGE === 'before' ? 'before' : 'after';
  const width = info.project.name === 'mobile' ? 390 : 1440;
  await page.setViewportSize({ width, height: 960 });
  for (const theme of ['light', 'dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    for (const [name, path] of destinations) {
      await ready(page, path!);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
      await page.screenshot({ path: `.harness/tmp/refinement/${stage}-${width}-${theme}-${name}.png`, fullPage: true, animations: 'disabled' });
    }
    for (const [name, path, action] of formFamilies) {
      await ready(page, path!);
      if (action) await page.getByRole('button', { name: action, exact: true }).click();
      await expect(page.locator('#main form').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name).toBe(true);
      await page.screenshot({ path: `.harness/tmp/refinement/${stage}-${width}-${theme}-form-${name}.png`, fullPage: true, animations: 'disabled' });
    }
  }
  expect(state.financialWrites).toBe(0); expect(state.errors).toEqual([]);
});

test('form families keep fields and actions inside the page at every supported width', async ({ page }, info) => {
  test.setTimeout(180_000);
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  const widths = info.project.name === 'mobile' ? [320,375,390] : [768,1024,1440];
  for(const width of widths) {
    await page.setViewportSize({width,height:960});
    for(const theme of ['light','dark']) {
      await page.getByLabel('Tema').selectOption(theme);
      for(const [name,path,action] of formFamilies) {
        await ready(page,path!);
        if(action) await page.getByRole('button',{name:action,exact:true}).click();
        await expect(page.locator('#main form').first()).toBeVisible();
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+':'+width+':'+theme).toBe(true);
        const defects=await page.locator('#main form input:not([type=checkbox]):not([type=radio]), #main form select, #main form .ui-button').evaluateAll(elements=>elements.flatMap(element=>{
          const rect=element.getBoundingClientRect(),parent=element.parentElement!.getBoundingClientRect();
          if(!rect.width)return [];
          return rect.height<44||rect.right>parent.right+1||rect.left<parent.left-1?[element.getAttribute('name')??element.id??element.textContent]:[];
        }));
        expect(defects,name+':'+width+':'+theme).toEqual([]);
      }
    }
  }
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('native select uses themed popup and keyboard selection without a financial request', async ({page},info)=>{
  const state=await uiuxBoundary(page);await uiuxLogin(page);
  for(const theme of ['light','dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    await ready(page,'/finance/debts');await page.getByRole('button',{name:'Nova dívida',exact:true}).click();
    const currency=page.getByLabel('Moeda',{exact:true});
    await expect(currency).toHaveValue('BRL');await currency.click();
    await expect.poll(()=>currency.evaluate(element=>element.matches(':open'))).toBe(true);
    await page.screenshot({path:`.harness/tmp/refinement/select-${info.project.name}-${theme}.png`,animations:'disabled'});
    await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    await expect(currency).toHaveValue('USD');await expect(currency).toBeFocused();
    await currency.click();await page.keyboard.press('Escape');await expect(currency).toBeFocused();
    await expect(page.getByRole('button',{name:'Salvar dívida'})).toBeVisible();
  }
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('all destinations reflow across supported widths with readable controls in both themes', async ({ page }, info) => {
  test.setTimeout(180_000);
  const state = await uiuxBoundary(page); await uiuxLogin(page);
  const widths = info.project.name === 'mobile' ? [320, 375, 390] : [768, 1024, 1440];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 960 });
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema').selectOption(theme);
      for (const [, path] of destinations) {
        await ready(page, path!);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path + ':' + width + ':' + theme).toBe(true);
        const undersized = await page.locator('#main input:not([type=checkbox]):not([type=radio]), #main select').evaluateAll(elements => elements.filter(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height < 44).map(element => element.getAttribute('aria-label') ?? element.id));
        expect(undersized, path + ':' + width).toEqual([]);
      }
    }
  }
  expect(state.financialWrites).toBe(0); expect(state.errors).toEqual([]);
});

test('public form inventory uses both themes at desktop and mobile widths', async ({ page }, info) => {
  await uiuxBoundary(page);
  const stage = process.env.UIUX_CAPTURE_STAGE === 'before' ? 'before' : 'after';
  const width = info.project.name === 'mobile' ? 390 : 1440;
  await page.setViewportSize({ width, height: 960 });
  for (const path of ['/login', '/signup', '/forgot-password', '/auth/recovery']) {
    await page.goto(path); await expect(page.locator('#main h1')).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Tema').selectOption(theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.harness/tmp/refinement/${stage}-${width}-${theme}-${path.slice(1).replaceAll('/', '-')}.png`, fullPage: true, animations: 'disabled' });
    }
  }
});

test('public validation keeps submit in place and labels align with their peers',async({page})=>{
  const state=await uiuxBoundary(page);
  for(const [path,button] of [['/login','Entrar na minha conta'],['/signup','Criar minha conta'],['/forgot-password','Enviar link de recuperação']]) {
    await page.goto(path!);const submit=page.getByRole('button',{name:button!,exact:true});
    const y=await submit.evaluate(e=>e.getBoundingClientRect().top+scrollY);
    await submit.click();await expect(page.getByRole('alert')).toHaveCount(1);
    expect(Math.abs(await submit.evaluate(e=>e.getBoundingClientRect().top+scrollY)-y)).toBeLessThanOrEqual(2);
  }
  await uiuxLogin(page);await ready(page,'/finance/transactions?action=create');
  await page.setViewportSize({width:1440,height:960});
  const source=await page.getByLabel('Conta',{exact:true}).boundingBox(),category=await page.getByLabel('Categoria',{exact:true}).boundingBox();
  expect(Math.abs(source!.y-category!.y)).toBeLessThanOrEqual(1);
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});
