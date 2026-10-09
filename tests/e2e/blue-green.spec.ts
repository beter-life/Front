import { test, expect, type Page } from '@playwright/test';
import { uiuxBoundary, uiuxLogin } from './uiux-boundary';
import { expenseCategory } from '../fixtures/cards';

async function openCalendar(page: Page, label: string) {
  const field=page.getByLabel(label,{exact:true});
  await field.locator('..').getByRole('button',{name:/Abrir calendário/}).click();
  await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.getByRole('grid')).toBeVisible();
  return field;
}

test('V2.3 budget editors keep compact fields, panel spacing and a full-width single category',async({page},info)=>{
  test.setTimeout(120_000);const state=await uiuxBoundary(page);
  await page.route('**/api/v1/finance/categories',route=>route.fulfill({json:[expenseCategory,{...expenseCategory,id:'44444444-4444-4444-8444-444444444449',name:'Outra despesa'}]}));
  await uiuxLogin(page);
  for(const width of info.project.name==='mobile'?[320,375,390]:[768,1024,1440]) {
    await page.setViewportSize({width,height:960});
    for(const theme of ['light','dark']) {
      await page.goto('/finance/budgets');await page.getByLabel('Tema').selectOption(theme);
      await page.getByRole('button',{name:'Adicionar categoria',exact:true}).click();
      const editor=page.locator('.budget-planning > .ui-form-panel'),category=page.locator('.budget-category');
      await expect(editor).toBeVisible();await expect(category).toHaveCount(1);
      const form=await editor.boundingBox(),card=await category.boundingBox();
      expect(Math.abs(form!.x-card!.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(form!.width-card!.width)).toBeLessThanOrEqual(1);
      expect(card!.y-(form!.y+form!.height)).toBeGreaterThanOrEqual(23);
      expect(card!.y-(form!.y+form!.height)).toBeLessThanOrEqual(25);
      const fields=await editor.locator('input,select').evaluateAll(elements=>elements.map(element=>{const box=element.getBoundingClientRect();return {width:box.width,height:box.height,top:box.top,left:box.left};}));
      expect(fields).toHaveLength(3);
      for(const field of fields) {
        expect(field.width,`${width}:${theme}: field width`).toBeGreaterThanOrEqual(120);
        expect(field.width,`${width}:${theme}: field width`).toBeLessThanOrEqual(320);
        expect(field.height,`${width}:${theme}: field height`).toBeGreaterThanOrEqual(44);
      }
      expect(fields[1]!.width).toBeLessThanOrEqual(280);
      if(width===1440) expect(Math.max(...fields.map(field=>field.top))-Math.min(...fields.map(field=>field.top))).toBeLessThanOrEqual(1);
      if(width===1024) {expect(Math.abs(fields[0]!.top-fields[1]!.top)).toBeLessThanOrEqual(1);expect(fields[2]!.top).toBeGreaterThan(fields[0]!.top);}
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo(0,0);});
      await page.screenshot({path:`.harness/tmp/blue-green/budget-editor-${width}-${theme}.png`,fullPage:true,animations:'disabled'});
      await editor.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(editor).toHaveCount(0);
      await category.getByRole('button',{name:'Editar limite',exact:true}).click();
      await expect(category.getByLabel('Limite planejado',{exact:true})).toHaveValue('500.00');
      await expect(category.getByLabel('Sobra do mês anterior',{exact:true})).toHaveValue('NONE');
      await category.getByLabel('Sobra do mês anterior',{exact:true}).selectOption('POSITIVE_ONLY');
      await category.getByRole('button',{name:'Cancelar edição',exact:true}).click();
      await category.getByRole('button',{name:'Editar limite',exact:true}).click();
      await expect(category.getByLabel('Sobra do mês anterior',{exact:true})).toHaveValue('NONE');
      await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();window.scrollTo(0,0);});
      await page.screenshot({path:`.harness/tmp/blue-green/budget-edit-${width}-${theme}.png`,fullPage:true,animations:'disabled'});
    }
  }
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('V2.3 outer panels align and form grids reflow at every supported width',async({page},info)=>{
  test.setTimeout(120_000); const state=await uiuxBoundary(page,{movements:true}); await uiuxLogin(page);
  for(const width of info.project.name==='mobile'?[320,375,390]:[768,1024,1440]) {
    await page.setViewportSize({width,height:960});
    for(const theme of ['light','dark']) {
      await page.goto('/finance/transactions?action=create'); await page.getByLabel('Tema').selectOption(theme);
      const boxes=await page.locator('#main .ui-form-panel, #main .ui-filter-panel, #main .finance-movements').evaluateAll(elements=>elements.map(element=>{
        const rect=element.getBoundingClientRect();return {left:rect.left,right:rect.right,width:rect.width};
      }));
      expect(boxes).toHaveLength(3);
      for(const box of boxes) { expect(Math.abs(box.left-boxes[0]!.left)).toBeLessThanOrEqual(1);expect(Math.abs(box.right-boxes[0]!.right)).toBeLessThanOrEqual(1); }
      const controls=await page.locator('.ui-form-panel .ui-form-grid').first().locator('input,select').evaluateAll(nodes=>nodes.map(node=>node.getBoundingClientRect().width));
      expect(controls.every(width=>width>=120&&width<=660)).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:`.harness/tmp/blue-green/after-${width}-${theme}-movements-open.png`,fullPage:true,animations:'disabled'});
    }
  }
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('V2.3 rail shares one icon axis and keeps keyboard scroll, tooltip and account access',async({page},info)=>{
  const state=await uiuxBoundary(page);await uiuxLogin(page);await page.setViewportSize({width:1440,height:640});
  await page.getByRole('button',{name:'Recolher navegação',exact:true}).click();
  for(const theme of ['light','dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    const centers=await page.locator('.global-sidebar .brand svg,.global-sidebar .sidebar-brand-row button svg,.global-sidebar .nav-link svg,.global-sidebar .nav-account > button svg').evaluateAll(elements=>elements.map(element=>{
      const rect=element.getBoundingClientRect();return rect.left+rect.width/2;
    }));
    expect(centers.length).toBeGreaterThan(14);expect(Math.max(...centers)-Math.min(...centers)).toBeLessThanOrEqual(1);
    const nav=page.getByRole('navigation',{name:'Navegação principal'});
    await nav.getByRole('link',{name:'Categorias',exact:true}).focus();
    await expect(page.getByRole('tooltip')).toHaveText('Categorias');
    expect(await nav.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
    const tooltip=await page.getByRole('tooltip').boundingBox();expect(tooltip!.x).toBeGreaterThan(70);expect(tooltip!.y+tooltip!.height).toBeLessThanOrEqual(640);
    await expect(page.locator('.nav-account').getByRole('link',{name:'Meu perfil',exact:true})).toBeVisible();
    await page.screenshot({path:`.harness/tmp/blue-green/rail-${info.project.name}-${theme}.png`,animations:'disabled'});
  }
  await expect(page.locator('.nav-link.active')).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Expandir navegação',exact:true}).click();
  await page.screenshot({path:`.harness/tmp/blue-green/sidebar-expanded-${info.project.name}.png`,animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await expect(page.getByRole('button',{name:'Abrir menu completo',exact:true})).toBeVisible();
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('V2.3 scrollbar, system theme, contrast and semantic colors follow the theme',async({page})=>{
  await uiuxBoundary(page);await uiuxLogin(page);
  function luminance(color:string){const rgb=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return rgb[0]!*.2126+rgb[1]!*.7152+rgb[2]!*.0722;}
  const contrast=(a:string,b:string)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
  for(const theme of ['light','dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    await expect(page.locator('.ui-page-header .ui-primary')).toHaveCSS('background-color',theme==='light'?'rgb(29, 78, 216)':'rgb(96, 165, 250)');
    const values=await page.evaluate(()=>{const root=getComputedStyle(document.documentElement),button=getComputedStyle(document.querySelector('.ui-primary')!);return {primary:root.getPropertyValue('--primary').trim(),green:root.getPropertyValue('--brand-green').trim(),scroll:root.scrollbarColor,gutter:root.scrollbarGutter,width:root.scrollbarWidth,button:button.backgroundColor,text:button.color};});
    expect(values.primary).toBe(theme==='light'?'#1d4ed8':'#60a5fa');expect(values.green).toBe(theme==='light'?'#0f766e':'#2dd4bf');
    expect(values.scroll).not.toBe('auto');expect(values.gutter).toBe('stable');expect(values.width).not.toBe('none');expect(contrast(values.button,values.text)).toBeGreaterThanOrEqual(4.5);
    await page.screenshot({path:`.harness/tmp/blue-green/scrollbar-${theme}.png`,animations:'disabled'});
  }
  await page.emulateMedia({colorScheme:'dark'});await page.getByLabel('Tema').selectOption('system');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.emulateMedia({colorScheme:'light'});await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.emulateMedia({forcedColors:'active'});expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollbarColor)).toBe('auto');
});

test('V2.3 date picker keyboard crosses month boundaries and returns focus without submitting',async({page},info)=>{
  const state=await uiuxBoundary(page);await uiuxLogin(page);await page.goto('/finance/transactions?action=create');
  for(const theme of ['light','dark']) {
    await page.getByLabel('Tema').selectOption(theme);
    const initial=page.getByLabel('Data inicial',{exact:true});await initial.fill('2026-01-31');await openCalendar(page,'Data inicial');
    await expect(page.getByRole('grid')).toHaveAttribute('aria-label',/janeiro 2026/i);
    await expect(page.locator('.rdp-day_button:focus')).toHaveAccessibleName(/31 de janeiro de 2026/);
    await page.keyboard.press('ArrowRight');await expect(page.locator('.rdp-day_button:focus')).toHaveAccessibleName(/1 de fevereiro de 2026/);
    await page.screenshot({path:`.harness/tmp/blue-green/date-picker-${info.project.name}-${theme}.png`,animations:'disabled'});
    await page.keyboard.press('Enter');await expect(initial).toHaveValue('2026-02-01');await expect(initial).toBeFocused();await expect(page.getByRole('dialog')).toHaveCount(0);
    await openCalendar(page,'Data inicial');await page.keyboard.press('Escape');await expect(initial).toBeFocused();
    const when=page.getByLabel('Data e hora do movimento',{exact:true});await when.fill('2026-10-31T23:45');await openCalendar(page,'Data e hora do movimento');
    await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');await expect(when).toHaveValue('2026-11-01T23:45');
    for(const width of info.project.name==='mobile'?[320,375,390]:[768,1024,1440]) {
      await page.setViewportSize({width,height:960});await openCalendar(page,'Data e hora do movimento');
      const dialog=await page.getByRole('dialog').boundingBox();expect(dialog!.x).toBeGreaterThanOrEqual(0);expect(dialog!.x+dialog!.width).toBeLessThanOrEqual(width);
      expect(await page.getByRole('dialog').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
      await page.screenshot({path:`.harness/tmp/blue-green/date-picker-${width}-${theme}.png`,animations:'disabled'});
      await page.keyboard.press('Escape');await expect(when).toBeFocused();
    }
  }
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('V2.3 date picker respects minimum and maximum dates and profile timezone',async({page})=>{
  const state=await uiuxBoundary(page);await page.clock.install({time:new Date('2026-11-01T01:30:00Z')});await uiuxLogin(page);
  await page.goto('/finance/recurrences');await page.getByRole('button',{name:'Nova recorrência',exact:true}).click();
  await openCalendar(page,'Data inicial');await expect(page.locator('.rdp-today .rdp-day_button')).toHaveAccessibleName(/31 de outubro de 2026/);
  await page.keyboard.press('Escape');await page.goto('/finance/yield');await page.getByRole('button',{name:'Configurar rendimento',exact:true}).click();
  const field=page.getByLabel('Início de vigência',{exact:true}),minimum=await field.getAttribute('min');expect(minimum).toBeTruthy();
  await field.fill(minimum!);await openCalendar(page,'Início de vigência');await expect(page.locator('.rdp-day_button:focus')).toBeEnabled();
  await expect(page.getByRole('button',{name:'Mês anterior',exact:true})).toBeDisabled();await page.keyboard.press('ArrowLeft');
  expect(await page.locator('.rdp-day_button:focus').evaluate(element=>element.parentElement!.getAttribute('data-day'))).toBe(minimum);
  await page.keyboard.press('Escape');await page.goto('/finance/cards?action=create');
  const tracking=page.getByLabel('Início do acompanhamento',{exact:true});await expect(tracking).toHaveAttribute('max','2026-10-31');
  const maximum=await tracking.getAttribute('max');await tracking.fill(maximum!);await openCalendar(page,'Início do acompanhamento');
  await expect(page.getByRole('button',{name:'Próximo mês',exact:true})).toBeDisabled();await page.keyboard.press('ArrowRight');
  expect(await page.locator('.rdp-day_button:focus').evaluate(element=>element.parentElement!.getAttribute('data-day'))).toBe(maximum);
  expect(state.financialWrites).toBe(0);expect(state.errors).toEqual([]);
});

test('V2.3 forgotten password restores compact centered composition and retains neutral recovery',async({page},info)=>{
  await uiuxBoundary(page);await page.goto('/forgot-password');await expect(page.locator('.public-recovery')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Recuperar senha',exact:true})).toBeVisible();
  for(const theme of ['light','dark']) {
    await page.getByLabel('Tema').selectOption(theme);await page.screenshot({path:`.harness/tmp/blue-green/forgot-${info.project.name}-${theme}.png`,fullPage:true,animations:'disabled'});
  }
  const email=page.getByLabel('E-mail',{exact:true});await email.fill('unknown@example.test');await page.getByRole('button',{name:'Enviar link de recuperação'}).click();
  await expect(page.getByText('Se a conta puder receber recuperação, enviaremos as instruções.')).toBeVisible();
});
