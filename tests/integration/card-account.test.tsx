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
import { bankAccount,cardAccount,cardFixture } from '../fixtures/cards';

function setup(fail=false){
  const client={auth:{onAuthStateChange:vi.fn(),signOut:vi.fn()}} as unknown as AuthClientV2,store=new SessionStore(client.auth);store.accept(session);
  const state={fail,writes:0};
  const accounts=[{...bankAccount,name:'Nome repetido'},{...cardAccount,name:'Nome repetido'},{...cardAccount,id:'22222222-2222-4222-8222-222222222222',name:'Crédito sem vínculo'}];
  const fetcher:typeof fetch=async(url,init)=>{
    if(init?.method!=='GET'){state.writes++;throw Error('No writes in presentation tests');}
    const path=new URL(String(url)).pathname;
    if(path.endsWith('/me'))return Response.json({identity:{authUserId:session.user.id},profile});
    if(path.endsWith('/accounts'))return Response.json(accounts);
    if(path.endsWith('/cards'))return Response.json(state.fail?{}:[{...cardFixture,status:'ARCHIVED',archivedAt:cardFixture.createdAt}],{status:state.fail?503:200});
    throw Error('Unexpected endpoint');
  };
  const services=createServices(publicConfig(publicEnv),store,fetcher);
  render(<StrictMode><AuthProviderV2 client={client} store={store}><AppProviders services={services}><MemoryRouter initialEntries={['/finance/accounts']}><AuthV2Routes/></MemoryRouter></AppProviders></AuthProviderV2></StrictMode>);
  return {state,services,user:userEvent.setup()};
}
describe('Accounts card identification is presentation only',()=>{
  it('marks only the actual linked account, preserves archived history, names, balances and operations',async()=>{
    const {state}=setup();await screen.findByRole('link',{name:'Ver cartão Cartão teste'});
    const rows=document.querySelectorAll('.finance-account-grid > *');expect(rows).toHaveLength(3);
    expect(within(rows[0] as HTMLElement).queryByText('Cartão vinculado')).not.toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('Cartão vinculado')).toBeVisible();expect(within(rows[1] as HTMLElement).getByText('Cartão arquivado')).toBeVisible();
    expect(within(rows[1] as HTMLElement).getByRole('heading',{name:'Nome repetido'})).toBeVisible();expect(within(rows[1] as HTMLElement).getByText(/333,33/)).toBeVisible();
    expect(within(rows[1] as HTMLElement).getByRole('button',{name:'Editar Nome repetido'})).toBeEnabled();
    expect(within(rows[2] as HTMLElement).queryByText('Cartão vinculado')).not.toBeInTheDocument();
    expect(screen.getByRole('link',{name:'Ver cartão Cartão teste'})).toHaveAttribute('href','/finance/cards/'+cardFixture.id);expect(state.writes).toBe(0);
  });
  it('does not classify on lookup error, provides retry, and drops stale badges after a failed refresh',async()=>{
    const {state,services,user}=setup(true);expect(await screen.findByText(/Informações de vínculo com cartões indisponíveis/)).toBeVisible();expect(screen.queryByText('Cartão vinculado')).not.toBeInTheDocument();
    state.fail=false;await user.click(screen.getByRole('button',{name:'Tentar novamente'}));await screen.findByText('Cartão vinculado');
    state.fail=true;await services.queryClient.invalidateQueries({queryKey:['private','finance',session.user.id,'cards']});
    await waitFor(()=>expect(screen.queryByText('Cartão vinculado')).not.toBeInTheDocument());expect(screen.getByText(/Informações de vínculo com cartões indisponíveis/)).toBeVisible();expect(state.writes).toBe(0);
  });
});
