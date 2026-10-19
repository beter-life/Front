import { useId, useRef, useState, type ComponentProps } from 'react';
import { Link,useSearchParams } from 'react-router';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { ConfirmAction } from '../../components/ui/confirm-action';
import { Badge, DataSection, EmptyState, ErrorState, FormPanel, LoadingSkeleton, PageHeader, SectionHeader } from '../../components/ui/surface';
import { Feedback } from '../../components/feedback';
import { useServices } from '../../hooks/use-services';
import { useMe } from '../../profile/hooks';
import { ApiError } from '../../api/client';
import { Field, FinanceForm } from './forms';
import { useAccounts, useCategories, useFinanceMutation } from './hooks';
import { useInbox, useInboxReview } from './inbox-hooks';
import { useCards } from './card-hooks';
import { useDebts } from './debt-hooks';
import { linkedCard } from './card-account-view';
import { CardAccountLink } from './card-account-link';
import { inboxDraftFromForm, inboxIssues, inboxStatuses,inboxSources } from './inbox-view';
import { currencyDigits, InboxItemSchema, type Account, type Card, type Category, type InboxCreate, type InboxEdit, type InboxItem, type InboxQuery, type InboxReview } from './contracts.generated';
import { formatMoney } from './money';
import { budgetAmountInput } from './budget-view';
import { displayDate, localDateTime } from './dates';

function Select({label,...props}:ComponentProps<'select'>&{label:string}) {
  const id=useId();return <div className="finance-field"><Label htmlFor={id}>{label}</Label><select id={id} className="finance-select" {...props}/></div>;
}
function ProposalForm({initial,accounts,cards,categories,timeZone,onSaved,onCancel}:{initial?:InboxItem;accounts:Account[];cards:Card[]|undefined;categories:Category[];timeZone:string;onSaved:(row:InboxItem)=>void;onCancel:()=>void}) {
  const {finance}=useServices(),key=useRef(crypto.randomUUID());
  const [currency,setCurrency]=useState(initial?.currency??'BRL'),[kind,setKind]=useState(initial?.type??'EXPENSE');
  const [accountId,setAccountId]=useState(initial?.accountId??'');
  const accountGuidance=useId();
  const create=useFinanceMutation<InboxCreate>(input=>finance.createInbox(input));
  const edit=useFinanceMutation<InboxEdit>(input=>finance.editInbox(initial!.id,input));
  return <FormPanel aria-label={initial?'Editar proposta':'Nova proposta'}><SectionHeader title={initial?'Editar proposta pendente':'Nova proposta manual'}/>
    <p>Salvar uma proposta não altera saldos. Conta, valor e data podem ser completados durante a revisão.</p>
    <FinanceForm reset={false} button="Salvar proposta" onCancel={onCancel} submit={async data=>{
      if(!cards)throw new Error('A identificação de cartões está indisponível. Tente carregar os vínculos novamente antes de salvar.');
      // Disabled existing options are omitted by FormData. Preserve the user's current
      // selection explicitly; never silently clear an old proposal's linked account.
      data.set('accountId',accountId);
      const draft=inboxDraftFromForm(data,timeZone);
      const row=initial?await edit.mutateAsync({...draft,expectedVersion:initial.version}):await create.mutateAsync({...draft,idempotencyKey:key.current});
      onSaved(InboxItemSchema.parse(row));
    }}>
      <Field label="Descrição da proposta" name="description" required maxLength={500} defaultValue={initial?.description??''}/>
      <Select label="Tipo da proposta" name="type" value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></Select>
      <Select label="Moeda da proposta" name="currency" value={currency} onChange={e=>{setCurrency(e.target.value as typeof currency);setAccountId('');}}>{Object.keys(currencyDigits).map(c=><option key={c}>{c}</option>)}</Select>
      <Field key={currency} label={`Valor da proposta (${currency})`} name="amount" inputMode="decimal" defaultValue={initial?.amountMinor&&initial.currency===currency?budgetAmountInput(initial.amountMinor,currency):''} placeholder="Pode preencher depois"/>
      <Field label="Data e hora da proposta" type="datetime-local" name="occurredAt" defaultValue={initial?(initial.occurredAt?localDateTime(initial.occurredAt,timeZone):''):localDateTime(new Date().toISOString(),timeZone)}/>
      <Select label="Conta da proposta" name="accountId" aria-describedby={accountGuidance} value={accountId} disabled={!cards} onChange={e=>setAccountId(e.target.value)}><option value="">Escolher depois</option>{cards?accounts.filter(a=>a.currency===currency&&(a.isActive||a.id===initial?.accountId)).map(a=>{
        const card=linkedCard(cards,a.id);return <option key={a.id} value={a.id} disabled={!!card||!a.isActive}>{a.name} · {a.currency}{card?' — Cartão vinculado: '+card.displayName+(card.status==='ARCHIVED'?' (arquivado)':''):''}{!a.isActive?' (conta inativa)':''}</option>;
      }):accountId&&<option value={accountId}>Conta atual — vínculo indisponível</option>}</Select>
      <p id={accountGuidance} className="finance-note inbox-card-guidance">Compras no cartão devem ser registradas em Cartões. <Link className="ui-text-link" to="/finance/cards">Ir para Cartões</Link>{initial&&linkedCard(cards,initial.accountId)&&' O vínculo atual foi preservado; escolha outra conta para um lançamento comum.'}</p>
      <Select key={'category-'+kind} label="Categoria da proposta" name="categoryId" defaultValue={initial?.type===kind?initial.categoryId??'':''}><option value="">Sem categoria</option>{categories.filter(c=>c.isActive&&c.kind===kind).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select>
    </FinanceForm>
  </FormPanel>;
}
function ManagedDebtHelp({accountId}:{accountId:string|null}) {
  const debts=useDebts(),debt=debts.isSuccess?debts.data.find(row=>row.accountId===accountId):undefined;
  if(debt)return <p>Esta conta está vinculada à dívida gerenciada {debt.name}. Use o fluxo oficial de <Link className="ui-text-link" to={'/finance/debts/'+debt.id}>Dívidas</Link> ou escolha outra conta ao editar a proposta.</p>;
  return <div><p>A confirmação foi bloqueada pelo Backend para esta conta gerenciada. O vínculo não pôde ser identificado com segurança. Consulte <Link className="ui-text-link" to="/finance/cards">Cartões</Link> ou <Link className="ui-text-link" to="/finance/debts">Dívidas</Link>, ou escolha outra conta ao editar.</p>{debts.isError&&<ErrorState retry={()=>void debts.refetch()}>Informações da conta gerenciada indisponíveis.</ErrorState>}</div>;
}
function ReviewActions({review,cards,onRefresh}:{review:InboxReview;cards:Card[]|undefined;onRefresh:()=>Promise<unknown>}) {
  const {finance}=useServices(),[acknowledged,setAcknowledged]=useState<string|null>(null),[error,setError]=useState(''),locked=useRef(false);
  const row=review.candidate,confirm=useFinanceMutation<{expectedVersion:number;acknowledgeDuplicates:boolean}>(input=>finance.confirmInbox(row.id,input));
  const signature=row.version+':'+review.duplicates.map(d=>d.source+d.id).sort().join(','),ack=acknowledged===signature;
  const discard=useFinanceMutation<{expectedVersion:number}>(input=>finance.discardInbox(row.id,input)),busy=confirm.isPending||discard.isPending;
  const card=linkedCard(cards,row.accountId);
  return <>
    {review.issues.length>0&&<ul className="inbox-issues">{review.issues.map(issue=><li key={issue}>{issue==='MANAGED_ACCOUNT'?(card?<p>Esta conta está vinculada ao cartão {card.displayName}{card.status==='ARCHIVED'?' (arquivado)':''}. Compras no cartão devem ser registradas em Cartões. <Link className="ui-text-link" to={'/finance/cards/'+card.id}>Abrir cartão</Link>. Pagamentos de fatura usam o fluxo oficial de pagamento/transferência, não uma nova despesa. Para um lançamento comum, escolha outra conta ao editar.</p>:<ManagedDebtHelp accountId={row.accountId}/>):inboxIssues[issue]}</li>)}</ul>}
    {review.duplicates.length>0&&<section className="inbox-duplicates" aria-label="Possíveis duplicidades"><h3>Possíveis duplicidades</h3><p>Compare antes de confirmar. Valores semelhantes não provam que se trata do mesmo lançamento.</p><ul>{review.duplicates.map(d=><li key={d.source+d.id}>{d.source==='CANDIDATE'?'Proposta pendente':'Movimento existente'} · {d.description} · {formatMoney(d.amountMinor,d.currency)}</li>)}</ul>{review.duplicatesTruncated&&<p>Existem mais correspondências; são exibidas até dez de cada fonte.</p>}<label className="inbox-ack"><input type="checkbox" checked={ack} onChange={e=>setAcknowledged(e.target.checked?signature:null)} disabled={busy}/>Revisei as possíveis duplicidades e quero confirmar mesmo assim.</label></section>}
    <p>Confirmar criará uma única {row.type==='INCOME'?'receita':'despesa'} no Finance Core. Descartar mantém o histórico e não altera saldos.</p>
    <div className="ui-form-feedback" aria-live="polite">{error&&<Feedback>{error}</Feedback>}</div>
    <div className="ui-actions"><Button disabled={busy||!review.canConfirm||(review.duplicates.length>0&&!ack)} onClick={async()=>{
      if(locked.current)return;locked.current=true;setError('');
      try{await confirm.mutateAsync({expectedVersion:row.version,acknowledgeDuplicates:ack});}
      catch(failure){setError(failure instanceof ApiError&&failure.status===409?'A proposta mudou ou existe uma nova possível duplicidade. Revise as informações atualizadas antes de tentar novamente.':'Não foi possível confirmar. Tente novamente; a mesma proposta não criará dois lançamentos.');try{await onRefresh();}finally{locked.current=false;}}
    }}>{busy?'Aguarde…':'Confirmar lançamento'}</Button>
      <ConfirmAction label="Descartar proposta" title="Descartar esta proposta?" impact="A proposta será mantida no histórico como descartada. Nenhum lançamento será criado." confirmLabel="Descartar sem lançar" pending={busy} onConfirm={async()=>{if(locked.current)return;locked.current=true;try{await discard.mutateAsync({expectedVersion:row.version});}catch(failure){locked.current=false;throw failure;}}}/>
    </div>
  </>;
}
function Review({id,accounts,cards,categories,timeZone,onClose}:{id:string;accounts:Account[];cards:Card[]|undefined;categories:Category[];timeZone:string;onClose:()=>void}) {
  const query=useInboxReview(id),[editing,setEditing]=useState(false);
  if(query.isPending)return <LoadingSkeleton label="Carregando revisão…"/>;
  if(query.isError)return <ErrorState retry={()=>void query.refetch()}>Não foi possível carregar a revisão.</ErrorState>;
  const review=query.data,row=review.candidate;
  if(editing&&row.status==='PENDING')return <ProposalForm initial={row} accounts={accounts} cards={cards} categories={categories} timeZone={timeZone} onSaved={()=>setEditing(false)} onCancel={()=>setEditing(false)}/>;
  return <DataSection aria-label="Revisão da proposta"><SectionHeader title="Revisar proposta"><Button variant="outline" onClick={onClose}>Fechar revisão</Button></SectionHeader>
    <h3>{row.description}</h3><Badge>{inboxStatuses[row.status]}</Badge><Badge>{inboxSources[row.source]}</Badge><dl className="inbox-details"><div><dt>Valor</dt><dd>{row.amountMinor?formatMoney(row.amountMinor,row.currency):'Ainda não informado'}</dd></div><div><dt>Tipo</dt><dd>{row.type==='INCOME'?'Receita':'Despesa'}</dd></div><div><dt>Data</dt><dd>{row.occurredAt?displayDate(row.occurredAt,timeZone):'Ainda não informada'}</dd></div><div><dt>Conta</dt><dd>{accounts.find(a=>a.id===row.accountId)?.name??'Ainda não associada'}</dd></div><div><dt>Categoria</dt><dd>{categories.find(c=>c.id===row.categoryId)?.name??'Sem categoria'}</dd></div></dl>
    {linkedCard(cards,row.accountId)&&<CardAccountLink card={linkedCard(cards,row.accountId)!}/>}
    {row.status==='PENDING'?<><Button variant="outline" onClick={()=>setEditing(true)}>Editar proposta</Button><ReviewActions review={review} cards={cards} onRefresh={()=>query.refetch()}/></>:<><Feedback success>{row.status==='CONFIRMED'?'Lançamento confirmado. A referência original será reutilizada em qualquer retry.':'Proposta descartada. Nenhum movimento foi gerado.'}</Feedback>{row.transactionId&&<p><Link className="ui-text-link" to="/finance/transactions">Ver movimentos financeiros</Link></p>}</>}
  </DataSection>;
}
export function InboxPage() {
  const [filters,setFilters]=useState<InboxQuery>({status:'PENDING'}),[cursors,setCursors]=useState<{createdAt:string;id:string}[]>([]);
  const [creating,setCreating]=useState(false),[params,setParams]=useSearchParams();
  const candidate=params.get('candidate'),selected=z.uuid().safeParse(candidate).success?candidate!:'';
  const setSelected=(id:string)=>setParams(current=>{const next=new URLSearchParams(current);if(id)next.set('candidate',id);else next.delete('candidate');return next;},{replace:true});
  const accounts=useAccounts(),cards=useCards(),categories=useCategories(),me=useMe(),cursor=cursors.at(-1),list=useInbox({...filters,...(cursor?{cursorAt:cursor.createdAt,cursorId:cursor.id}:{})});
  const knownCards=cards.isSuccess?cards.data:undefined;
  const timeZone=me.data?.profile?.timezone??'UTC';
  const filter=(name:'status'|'currency'|'type',value:string)=>{setCursors([]);setFilters(current=>{const next={...current};delete next[name];return value?{...next,[name]:value}:next;});};
  return <><PageHeader title="Caixa de entrada financeira" description="Revise propostas manuais e importadas. Itens pendentes ou descartados não alteram seu dinheiro." actions={<><Button asChild variant="outline"><Link to="/finance/inbox/import">Importar extrato</Link></Button><Button disabled={creating||!knownCards||accounts.isPending||categories.isPending||accounts.isError||categories.isError} onClick={()=>{setSelected('');setCreating(true);}}><Plus/>Nova proposta</Button></>}/>
    {cards.isPending&&<p role="status">Identificando contas vinculadas a cartões…</p>}
    {cards.isError&&<ErrorState retry={()=>void cards.refetch()}>Informações de vínculo com cartões indisponíveis. Carregue os vínculos antes de criar ou salvar propostas.</ErrorState>}
    {(accounts.isError||categories.isError)&&<ErrorState retry={()=>{void accounts.refetch();void categories.refetch();}}>Não foi possível carregar contas e categorias.</ErrorState>}
    {creating&&accounts.data&&categories.data&&<ProposalForm accounts={accounts.data} cards={knownCards} categories={categories.data} timeZone={timeZone} onCancel={()=>setCreating(false)} onSaved={row=>{setCreating(false);setSelected(row.id);}}/>}
    <section className="finance-filters ui-filter-panel" aria-label="Filtros da caixa de entrada">
      <Select label="Estado da proposta" value={filters.status??''} onChange={e=>filter('status',e.target.value)}><option value="">Todos os estados</option><option value="PENDING">Pendentes</option><option value="CONFIRMED">Confirmados</option><option value="DISCARDED">Descartados</option></Select>
      <Select label="Tipo de lançamento" value={filters.type??''} onChange={e=>filter('type',e.target.value)}><option value="">Todos os tipos</option><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></Select>
      <Select label="Moeda dos itens" value={filters.currency??''} onChange={e=>filter('currency',e.target.value)}><option value="">Todas as moedas</option>{Object.keys(currencyDigits).map(c=><option key={c}>{c}</option>)}</Select>
    </section>
    {list.isPending?<LoadingSkeleton label="Carregando propostas…"/>:list.isError?<ErrorState retry={()=>void list.refetch()}>Não foi possível carregar as propostas.</ErrorState>:<DataSection aria-label="Lista de propostas"><SectionHeader title="Propostas"><Button variant="outline" onClick={()=>void list.refetch()} disabled={list.isFetching}>Atualizar lista</Button></SectionHeader>
      {!list.data.items.length?<EmptyState title="Nenhuma proposta neste filtro">Crie uma proposta manual ou consulte o histórico usando os filtros.</EmptyState>:<ul className="inbox-list">{list.data.items.map(row=><li key={row.id}><div><h3>{row.description}</h3><p>{row.type==='INCOME'?'Receita':'Despesa'} · {row.amountMinor?formatMoney(row.amountMinor,row.currency):'Valor pendente'} · {row.currency}</p><Badge>{inboxStatuses[row.status]}</Badge></div><Button variant="outline" aria-label={'Revisar '+row.description} onClick={()=>{setCreating(false);setSelected(row.id);}}>Revisar</Button></li>)}</ul>}
      <div className="ui-actions"><Button variant="outline" disabled={!cursors.length} onClick={()=>setCursors(c=>c.slice(0,-1))}>Página anterior</Button><Button variant="outline" disabled={!list.data.nextCursor} onClick={()=>setCursors(c=>[...c,list.data.nextCursor!])}>Próxima página</Button></div>
    </DataSection>}
    {selected&&accounts.data&&categories.data&&<Review key={selected} id={selected} accounts={accounts.data} cards={knownCards} categories={categories.data} timeZone={timeZone} onClose={()=>setSelected('')}/>}
  </>;
}
