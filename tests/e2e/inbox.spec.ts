import { test,expect,type Page } from '@playwright/test';
import { inboxItem } from '../fixtures/inbox';
import { bankAccount,expenseCategory } from '../fixtures/cards';
import type { InboxItem,InboxReview } from '../../src/features/finance/contracts.generated';
const owner='11111111-1111-4111-8111-111111111111',user={id:owner,aud:'authenticated',role:'authenticated',email:'test@example.test',created_at:'2026-01-01T00:00:00Z',app_metadata:{},user_metadata:{}};
const token=[Buffer.from('{"alg":"ES256","kid":"synthetic"}').toString('base64url'),Buffer.from(JSON.stringify({sub:owner,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url'),'synthetic-signature'].join('.');
const session={access_token:token,refresh_token:'synthetic-refresh',expires_in:3600,token_type:'bearer',user};
async function boundary(page:Page,options:{empty?:boolean;duplicate?:boolean}={}){
  const state={rows:options.empty?[]:[{...inboxItem}] as InboxItem[],writes:[] as {path:string;body:Record<string,unknown>}[],fail:false,stale:false};
  const headers={'access-control-allow-origin':'http://localhost:3103','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,PATCH,OPTIONS'};
  await page.route('**/auth/v1/**',route=>route.request().method()==='OPTIONS'?route.fulfill({status:204,headers}):route.fulfill({headers,json:new URL(route.request().url()).pathname.endsWith('/token')?session:user}));
  await page.route('**/api/v1/**',route=>{
    const request=route.request(),url=new URL(request.url()),path=url.pathname,reply=(json:unknown,status=200)=>route.fulfill({headers,json,status});
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    if(path.endsWith('/me'))return reply({identity:{authUserId:owner},profile:{id:owner,displayName:'Teste sintético',locale:'pt-BR',timezone:'America/Sao_Paulo',createdAt:user.created_at,updatedAt:user.created_at}});
    if(path.endsWith('/accounts'))return reply([bankAccount]);if(path.endsWith('/categories'))return reply([expenseCategory]);
    expect(path).toMatch(/^\/api\/v1\/finance\/inbox(?:\/|$)/);
    if(state.fail)return reply({},503);
    if(request.method()!=='GET'){
      const body=request.postDataJSON() as Record<string,unknown>;expect(body).not.toHaveProperty('ownerId');state.writes.push({path,body});
      if(path.endsWith('/inbox')){const {idempotencyKey:unused,...draft}=body;void unused;const row={...inboxItem,...draft};state.rows.push(row as InboxItem);return reply(row,201);}
      const row=state.rows.find(r=>path.includes(r.id))!;
      if(state.stale&&path.endsWith('/confirm')){row.version++;return reply({},409);}
      if(request.method()==='PATCH'){const {expectedVersion:unused,...draft}=body;void unused;Object.assign(row,draft,{version:row.version+1});}
      else Object.assign(row,{version:row.version+1,status:path.endsWith('/confirm')?'CONFIRMED':'DISCARDED',transactionId:path.endsWith('/confirm')?'99999999-9999-4999-8999-999999999999':null,processedAt:'2026-10-15T13:00:00Z'});
      return reply(row);
    }
    if(path.endsWith('/inbox'))return reply({items:state.rows.filter(r=>!url.searchParams.get('status')||r.status===url.searchParams.get('status')),nextCursor:null});
    const row=state.rows.find(r=>path.includes(r.id))!;const review:InboxReview={candidate:row,canConfirm:!!row.accountId&&!!row.amountMinor&&row.status==='PENDING',issues:row.accountId?[]:['ACCOUNT_REQUIRED'],duplicates:options.duplicate?[{id:bankAccount.id,source:'TRANSACTION',description:'Possível anterior',amountMinor:'1200',currency:'BRL',occurredAt:inboxItem.occurredAt!}]:[],duplicatesTruncated:false};return reply(review);
  });return state;
}
async function login(page:Page){await page.goto('/login');await page.getByLabel('E-mail').fill('test@example.test');await page.getByLabel('Senha',{exact:true}).fill('synthetic-password');await page.getByRole('button',{name:'Entrar na minha conta'}).click();await expect(page.getByRole('heading',{name:'Início'})).toBeVisible();await page.goto('/finance/inbox');await expect(page.getByRole('heading',{name:'Caixa de entrada financeira'})).toBeVisible();}
test('manual candidate, exact edit, single confirmation and history survive reload',async({page})=>{
  const state=await boundary(page,{empty:true});await login(page);await page.getByRole('button',{name:'Nova proposta'}).click();await page.getByLabel('Descrição da proposta').fill('Proposta teste');await page.getByLabel('Valor da proposta (BRL)').fill('12,34');await page.getByLabel('Conta da proposta').selectOption(bankAccount.id);await page.getByLabel('Categoria da proposta').selectOption(expenseCategory.id);
  await page.getByRole('button',{name:'Salvar proposta'}).dblclick();await expect(page.getByRole('heading',{name:'Revisar proposta'})).toBeVisible();expect(state.writes).toHaveLength(1);expect(state.writes[0]!.body.amountMinor).toBe('1234');
  await page.getByRole('button',{name:'Editar proposta'}).click();await page.getByLabel('Valor da proposta (BRL)').fill('35,40');await page.getByRole('button',{name:'Salvar proposta'}).click();await expect(page.getByRole('heading',{name:'Revisar proposta'})).toBeVisible();expect(state.writes[1]!.body).toMatchObject({expectedVersion:1,amountMinor:'3540'});
  await page.getByRole('button',{name:'Confirmar lançamento'}).dblclick();await expect(page.getByText(/Lançamento confirmado/)).toBeVisible();expect(state.writes.filter(w=>w.path.endsWith('/confirm'))).toHaveLength(1);
  await page.getByLabel('Estado da proposta').selectOption('CONFIRMED');await expect(page.getByRole('button',{name:'Revisar Proposta teste'})).toBeVisible();await page.reload();await page.getByLabel('Estado da proposta').selectOption('CONFIRMED');await page.getByRole('button',{name:'Revisar Proposta teste'}).click();await expect(page.getByText(/Lançamento confirmado/)).toBeVisible();await expect(page.getByRole('button',{name:'Editar proposta'})).toHaveCount(0);
});
test('duplicate acknowledgement and discard require explicit user actions',async({page})=>{
  const state=await boundary(page,{duplicate:true});await login(page);await page.getByRole('button',{name:'Revisar Proposta teste'}).click();await expect(page.getByRole('heading',{name:'Possíveis duplicidades'})).toBeVisible();await expect(page.getByRole('button',{name:'Confirmar lançamento'})).toBeDisabled();expect(state.writes).toHaveLength(0);
  await page.getByRole('checkbox',{name:/Revisei as possíveis/}).check();await expect(page.getByRole('button',{name:'Confirmar lançamento'})).toBeEnabled();await page.getByRole('button',{name:'Descartar proposta'}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Descartar sem lançar'}).click();await expect(page.getByText(/Proposta descartada/)).toBeVisible();expect(state.writes).toHaveLength(1);expect(state.writes[0]!.path).toMatch(/discard$/);
});
test('transport failure retries safely; stale confirmation does not present success',async({page})=>{
  const state=await boundary(page);state.fail=true;await login(page);await expect(page.getByText('Não foi possível carregar as propostas.')).toBeVisible();state.fail=false;await page.getByRole('button',{name:'Tentar novamente'}).click();await page.getByRole('button',{name:'Revisar Proposta teste'}).click();state.stale=true;await page.getByRole('button',{name:'Confirmar lançamento'}).click();await expect(page.getByText(/A proposta mudou/)).toBeVisible();await expect(page.getByText(/Lançamento confirmado/)).toHaveCount(0);expect(state.rows[0]!.status).toBe('PENDING');
});
test('tablet/mobile keyboard, theme and stable form geometry use the existing design system',async({page},info)=>{
  if(info.project.name==='desktop')await page.setViewportSize({width:820,height:1180});
  const state=await boundary(page,{empty:true});await login(page);await page.getByRole('button',{name:'Nova proposta'}).click();const description=page.getByLabel('Descrição da proposta'),submit=page.getByRole('button',{name:'Salvar proposta'});const before=await submit.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);await description.fill('Proposta de teclado');await page.getByLabel('Valor da proposta (BRL)').fill('123');const after=await submit.evaluate(el=>el.getBoundingClientRect().top+window.scrollY);expect(Math.abs(after-before)).toBeLessThan(1);await description.focus();await page.keyboard.press('Tab');await expect(page.getByLabel('Tipo da proposta')).toBeFocused();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);expect(state.writes).toHaveLength(0);
  await page.getByRole('combobox',{name:'Tema',exact:true}).selectOption('dark');await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.evaluate(()=>{(document.activeElement as HTMLElement|null)?.blur();window.scrollTo(0,0);});
  await page.screenshot({path:`.harness/tmp/inbox-${info.project.name}.png`,fullPage:true});
});
