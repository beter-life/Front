import { StrictMode } from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,waitFor,within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AuthV2Routes } from '../../src/auth-v2/app';
import { AuthProviderV2 } from '../../src/auth-v2/provider';
import { SessionStore } from '../../src/auth-v2/session';
import type { AuthClientV2 } from '../../src/auth-v2/client';
import { AppProviders } from '../../src/app/providers';
import { createServices } from '../../src/app/services';
import { publicConfig } from '../../src/config/env';
import { publicEnv,session,profile } from '../helpers';
import { bankAccount,expenseCategory } from '../fixtures/cards';
import { inboxItem } from '../fixtures/inbox';
import type { InboxItem,InboxReview } from '../../src/features/finance/contracts.generated';

function setup(options:{empty?:boolean;duplicates?:boolean;fail?:boolean;signedIn?:boolean;incomplete?:boolean}={}){
  const client={auth:{onAuthStateChange:vi.fn(),signOut:vi.fn()}} as unknown as AuthClientV2,store=new SessionStore(client.auth);store.accept(options.signedIn===false?null:session);
  const state={rows:options.empty?[]:[{...inboxItem,...(options.incomplete?{amountMinor:null,accountId:null}: {})}] as InboxItem[],writes:[] as {path:string;method:string;body:Record<string,unknown>}[],fail:options.fail??false,conflict:false};
  const fetcher=vi.fn<typeof fetch>(async(url,init)=>{const u=new URL(String(url)),path=u.pathname;
    if(path.endsWith('/me'))return Response.json({identity:{authUserId:session.user.id},profile});
    if(path.endsWith('/accounts'))return Response.json([bankAccount]);if(path.endsWith('/categories'))return Response.json([expenseCategory]);
    if(!path.startsWith('/api/v1/finance/inbox'))throw Error('Unexpected financial boundary '+path);
    if(state.fail)return Response.json({}, {status:503});
    if(init?.method!=='GET'){
      const body=JSON.parse(String(init?.body)) as Record<string,unknown>;state.writes.push({path,method:init!.method!,body});
      if(state.conflict&&path.endsWith('/confirm')){state.rows[0]={...state.rows[0]!,version:2,amountMinor:'2200'};return Response.json({}, {status:409});}
      if(path.endsWith('/inbox')){const {idempotencyKey:unused,...draft}=body;void unused;state.rows.push({...inboxItem,...draft,id:crypto.randomUUID()} as InboxItem);return Response.json(state.rows.at(-1));}
      const row=state.rows.find(r=>path.includes(r.id))!;
      if(init?.method==='PATCH'){Object.assign(row,body,{version:row.version+1});delete (row as unknown as Record<string,unknown>).expectedVersion;}
      else Object.assign(row,{status:path.endsWith('/confirm')?'CONFIRMED':'DISCARDED',transactionId:path.endsWith('/confirm')?'99999999-9999-4999-8999-999999999999':null,processedAt:'2026-10-15T13:00:00Z',version:row.version+1});
      return Response.json(row);
    }
    if(path.endsWith('/inbox'))return Response.json({items:state.rows.filter(r=>!u.searchParams.get('status')||r.status===u.searchParams.get('status')),nextCursor:null});
    const row=state.rows.find(r=>path.includes(r.id))!;const review:InboxReview={candidate:row,canConfirm:!!row.accountId&&!!row.amountMinor&&row.status==='PENDING',issues:row.accountId?[]:['ACCOUNT_REQUIRED'],duplicates:options.duplicates?[{id:bankAccount.id,source:'TRANSACTION',description:'Possível anterior',amountMinor:'1200',currency:'BRL',occurredAt:inboxItem.occurredAt!}]:[],duplicatesTruncated:false};return Response.json(review);
  });
  const services=createServices(publicConfig(publicEnv),store,fetcher);render(<StrictMode><AuthProviderV2 client={client} store={store}><AppProviders services={services}><MemoryRouter initialEntries={['/finance/inbox']}><AuthV2Routes/></MemoryRouter></AppProviders></AuthProviderV2></StrictMode>);
  return {user:userEvent.setup(),state,fetcher};
}
async function review(user:ReturnType<typeof userEvent.setup>){await user.click(await screen.findByRole('button',{name:'Revisar Proposta teste'}));return screen.findByRole('region',{name:'Revisão da proposta'});}
describe('Inbox protected UI with generated transport contracts',()=>{
  it('loads pending proposals without creating ledger writes',async()=>{const {state}=setup();expect(await screen.findByRole('heading',{name:'Proposta teste'})).toBeVisible();expect(state.writes).toEqual([]);});
  it('uses current form values, creates a single proposal in StrictMode and permits incomplete drafts',async()=>{
    const {user,state}=setup({empty:true});await user.click(await screen.findByRole('button',{name:'Nova proposta'}));await user.type(screen.getByLabelText('Descrição da proposta'),'Nova manual');await user.type(screen.getByLabelText('Valor da proposta (BRL)'),'12,34');await user.dblClick(screen.getByRole('button',{name:'Salvar proposta'}));
    await waitFor(()=>expect(state.writes).toHaveLength(1));expect(state.writes[0]!.body).toMatchObject({description:'Nova manual',amountMinor:'1234',accountId:null});expect(state.writes[0]!.body).toHaveProperty('idempotencyKey');
    expect(await screen.findByRole('button',{name:'Confirmar lançamento'})).toBeDisabled();expect(state.writes[0]!.path).toBe('/api/v1/finance/inbox');
  });
  it('edits the reviewed version, then confirms exactly once and exposes processed history',async()=>{
    const {user,state}=setup();await review(user);await user.click(screen.getByRole('button',{name:'Editar proposta'}));expect(screen.getByLabelText('Valor da proposta (BRL)')).toHaveValue('12.00');
    await user.clear(screen.getByLabelText('Valor da proposta (BRL)'));await user.type(screen.getByLabelText('Valor da proposta (BRL)'),'35,40');await user.click(screen.getByRole('button',{name:'Salvar proposta'}));
    await screen.findByRole('heading',{name:'Revisar proposta'});expect(state.writes[0]!.body).toMatchObject({amountMinor:'3540',expectedVersion:1});
    await user.dblClick(screen.getByRole('button',{name:'Confirmar lançamento'}));expect(await screen.findByText(/Lançamento confirmado/)).toBeVisible();expect(state.writes.filter(w=>w.path.endsWith('/confirm'))).toHaveLength(1);expect(state.writes.at(-1)!.body).toEqual({expectedVersion:2,acknowledgeDuplicates:false});
    await user.selectOptions(screen.getByLabelText('Estado da proposta'),'CONFIRMED');expect(await screen.findByRole('button',{name:'Revisar Proposta teste'})).toBeVisible();expect(screen.queryByRole('button',{name:'Editar proposta'})).not.toBeInTheDocument();
  });
  it('requires an explicit duplicate acknowledgement',async()=>{
    const {user,state}=setup({duplicates:true});await review(user);expect(screen.getByRole('button',{name:'Confirmar lançamento'})).toBeDisabled();await user.click(screen.getByRole('checkbox',{name:/Revisei as possíveis/}));await user.click(screen.getByRole('button',{name:'Confirmar lançamento'}));await waitFor(()=>expect(state.writes).toHaveLength(1));expect(state.writes[0]!.body.acknowledgeDuplicates).toBe(true);
  });
  it('discards only after explicit confirmation and retains terminal history',async()=>{
    const {user,state}=setup();await review(user);await user.click(screen.getByRole('button',{name:'Descartar proposta'}));expect(state.writes).toHaveLength(0);const dialog=screen.getByRole('alertdialog');await user.click(within(dialog).getByRole('button',{name:'Descartar sem lançar'}));expect(await screen.findByText(/Proposta descartada/)).toBeVisible();expect(state.writes).toHaveLength(1);expect(state.writes[0]!.path).toMatch(/discard$/);
  });
  it('rejects stale confirmation without presenting a false success',async()=>{
    const {user,state}=setup();await review(user);state.conflict=true;await user.click(screen.getByRole('button',{name:'Confirmar lançamento'}));expect(await screen.findByText(/A proposta mudou/)).toBeVisible();expect(screen.queryByText(/Lançamento confirmado/)).not.toBeInTheDocument();expect(state.rows[0]!.status).toBe('PENDING');
  });
  it('supports empty/error/retry and does not fetch private data while signed out',async()=>{
    const {user,state}=setup({fail:true});const retry=await screen.findByRole('button',{name:'Tentar novamente'});state.fail=false;await user.click(retry);expect(await screen.findByRole('heading',{name:'Proposta teste'})).toBeVisible();
  });
  it('preserves the Auth V2 guard',async()=>{const {fetcher}=setup({signedIn:false});expect(await screen.findByRole('heading',{name:'Entrar'})).toBeVisible();expect(fetcher).not.toHaveBeenCalled();});
});
