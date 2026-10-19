import { useRef,useState } from 'react';
import type { ReactNode } from 'react';
import { Link,useSearchParams } from 'react-router';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Badge,DataSection,EmptyState,ErrorState,FormPanel,LoadingSkeleton,PageHeader,SectionHeader } from '../../components/ui/surface';
import { Feedback } from '../../components/feedback';
import { useServices } from '../../hooks/use-services';
import { useMe } from '../../profile/hooks';
import { useAccounts,useFinanceMutation } from './hooks';
import { Field,FinanceForm } from './forms';
import { displayDate,localDateTime } from './dates';
import { formatMoney } from './money';
import { useReconciliationQuery } from './reconciliation-hooks';
import { reconciliationFilters,reconciliationLabels,reconciliationNotice } from './reconciliation-view';
import type * as C from './contracts.generated';

type Cursor={createdAt:string;id:string};
type View='evidence'|'movements'|'proposals'|'history';
function Pages({previous,next,busy,back,forward}:{previous:boolean;next:Cursor|null;busy:boolean;back:()=>void;forward:(c:Cursor)=>void}){return <div className="ui-actions"><Button variant="outline" disabled={!previous||busy} onClick={back}>Página anterior</Button><Button variant="outline" disabled={!next||busy} onClick={()=>next&&forward(next)}>Próxima página</Button></div>;}
function MatchState({match}:{match:C.ReconciliationMatch|null}){return <Badge>{!match?'Sem conciliação registrada':match.reversedAt?'Conciliação desfeita':match.valid?'Conciliado — já contabilizado':'Vínculo invalidado — revisão necessária'}</Badge>;}
function Rows({q,view,zone,open}:{q:C.ReconciliationQuery;view:View;zone:string;open:(id:string)=>void}){
  const {finance}=useServices(),[cursors,setCursors]=useState<Cursor[]>([]),cursor=cursors.at(-1),filters={...q,...(cursor?{cursorAt:cursor.createdAt,cursorId:cursor.id}:{})};
  const request=async(signal:AbortSignal)=>{
    if(view==='evidence')return {kind:'evidence' as const,...await finance.reconciliationEvidence(filters,signal)};
    if(view==='movements')return {kind:'movements' as const,...await finance.reconciliationMovements(filters,signal)};
    if(view==='proposals')return {kind:'proposals' as const,...await finance.reconciliationProposals(filters,signal)};
    return {kind:'history' as const,...await finance.reconciliationHistory(filters,signal)};
  };
  const result=useReconciliationQuery(view,filters,request);
  if(result.isPending)return <LoadingSkeleton label="Carregando dados de conciliação…"/>;
  if(result.isError)return <ErrorState retry={()=>void result.refetch()}>Não foi possível carregar a conferência. Confira a sessão e tente novamente.</ErrorState>;
  const p=result.data,rows=p.kind==='evidence'?p.items.map(e=><li key={e.id}><div><h3>{e.description}</h3><p>{formatMoney(e.amountMinor,e.currency)} · {displayDate(e.occurredAt,zone)}</p><MatchState match={e.match}/></div><Button variant="outline" onClick={()=>open(e.id)}>Revisar evidência</Button></li>):
    p.kind==='movements'?p.items.map(({transaction:t,match})=><li key={t.id}><div><h3>{t.description}</h3><p>{t.type==='TRANSFER'?'Transferência':t.type==='INCOME'?'Receita':'Despesa'} · {formatMoney(t.amountMinor,t.currency)} · {displayDate(t.occurredAt,zone)}</p>{t.isCancelled?<Badge>Lançamento cancelado</Badge>:<MatchState match={match}/>}<p>{t.type==='TRANSFER'?'Transferências mantêm seu fluxo oficial e não são conciliadas com linhas de receita/despesa.':!match?'Sem evidência preservada vinculada. Isso não comprova ausência no extrato.':!match.valid?'O lançamento mudou ou foi cancelado. Revise e desfaça o vínculo, sem alterar o movimento.':'Conferência registrada; o lançamento já pertencia ao saldo.'}</p>{match&&<Button variant="outline" onClick={()=>open(match.evidenceId)}>Ver conciliação</Button>}</div></li>):
    p.kind==='proposals'?p.items.map(({candidate:c,batchId,rowNumber})=><li key={batchId+':'+rowNumber}><div><h3>{c.description}</h3><Badge>{c.status==='PENDING'?'Proposta pendente — fora do saldo':c.status==='DISCARDED'?'Proposta descartada — fora do saldo':'Proposta confirmada na Inbox'}</Badge><p>Receipt de importação da linha {rowNumber}. Não equivale ao extrato completo nem preserva os campos originais após expiração.</p><div className="ui-actions"><Link className="ui-text-link" to={'/finance/inbox?candidate='+c.id}>Abrir proposta</Link><Link className="ui-text-link" to={'/finance/inbox/import?batch='+batchId}>Ver importação</Link></div></div></li>):
    p.items.map(m=><li key={m.id}><div><h3>Conferência registrada em {displayDate(m.createdAt,zone)}</h3><MatchState match={m}/>{m.reversedAt&&<p>Desfeita em {displayDate(m.reversedAt,zone)}. Histórico preservado.</p>}</div><Button variant="outline" onClick={()=>open(m.evidenceId)}>Ver evidência e histórico</Button></li>);
  return <DataSection aria-label="Dados de conciliação"><SectionHeader title={{evidence:'Evidências preservadas',movements:'Movimentos já contabilizados',proposals:'Propostas importadas e receipts',history:'Histórico de conciliações'}[view]}/>{view==='history'&&<p>O período do histórico considera a data de criação da conciliação.</p>}{rows.length?<ul className="inbox-list reconciliation-list">{rows}</ul>:<EmptyState title="Nenhum registro nesta página">Confira os filtros ou preserve explicitamente linhas válidas de uma importação. Um extrato não capturado pode estar incompleto ou indisponível.</EmptyState>}<Pages previous={!!cursors.length} next={result.data.nextCursor} busy={result.isFetching} back={()=>setCursors(c=>c.slice(0,-1))} forward={c=>setCursors(v=>[...v,c])}/></DataSection>;
}
function ConfirmReview({review,zone}:{review:C.ReconciliationReview;zone:string}){
  const {finance}=useServices(),[selected,setSelected]=useState(''),[ackDate,setAckDate]=useState(false),[ack,setAck]=useState(false),[error,setError]=useState(''),locked=useRef(false),command=useRef<{payload:string;key:string}|null>(null);
  const mutation=useFinanceMutation<C.ReconciliationConfirm>(input=>finance.confirmReconciliation(input)),choice=review.suggestions.find(s=>s.transaction.id===selected),completed=useRef(false);
  return <form className="reconciliation-review" onSubmit={async event=>{event.preventDefault();if(completed.current||locked.current||!ack||!choice||!choice.compatible||choice.conflicting||choice.dateDifference&&!ackDate||review.managed||review.evidence.match)return;locked.current=true;setError('');const payload=JSON.stringify([review.evidence.id,selected,ackDate]);if(command.current?.payload!==payload)command.current={payload,key:crypto.randomUUID()};try{await mutation.mutateAsync({evidenceId:review.evidence.id,transactionId:selected,idempotencyKey:command.current.key,acknowledgeDateDifference:ackDate});completed.current=true;}catch{setError('Não foi possível concluir a resposta. Atualize ou tente novamente; a mesma solicitação não duplica conciliações.');}finally{locked.current=false;}}}>
    <fieldset disabled={mutation.isPending||review.managed||!!review.evidence.match}><legend>Escolha explicitamente o lançamento a conferir</legend>
      {!review.suggestions.length&&<p>Não há correspondência nos dados disponíveis. Não será criado um lançamento para compensar essa ausência.</p>}
      {review.suggestions.map(s=><label className="inbox-ack reconciliation-option" key={s.transaction.id}><input type="radio" name="transactionId" value={s.transaction.id} checked={selected===s.transaction.id} disabled={!s.compatible||s.conflicting} onChange={()=>{setSelected(s.transaction.id);setAck(false);setAckDate(false);}}/><span><strong>{s.transaction.description}</strong><span className="reconciliation-line">{formatMoney(s.transaction.amountMinor,s.transaction.currency)} · {displayDate(s.transaction.occurredAt,zone)}</span><span className="reconciliation-line">{s.cancelled?'Lançamento cancelado':s.managed?'Movimento gerenciado — use o módulo de origem':s.conflicting?'Já vinculado a outra evidência':s.amountDifference?'Valor diferente — não pode conciliar':s.provenLink?'Origem comprovada por vínculo persistente':'Sugestão; descrição e valor não comprovam a origem'}{s.dateDifference?' · Data diferente — conferir':''}</span></span></label>)}
      {choice?.dateDifference&&<label className="inbox-ack"><input type="checkbox" checked={ackDate} onChange={e=>setAckDate(e.target.checked)}/>Conferi a diferença de data e aceito esta correspondência.</label>}
      <label className="inbox-ack"><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/>Revisei a evidência e o lançamento. Quero registrar apenas a conferência, sem movimentar dinheiro.</label>
      <div className="ui-form-feedback" aria-live="polite">{error&&<Feedback>{error}</Feedback>}</div><Button type="submit" disabled={!ack||!choice||!choice.compatible||choice.conflicting||choice.dateDifference&&!ackDate||mutation.isPending}>{mutation.isPending?'Registrando conferência…':'Confirmar conciliação'}</Button>
    </fieldset>
  </form>;
}
function Reverse({match}:{match:C.ReconciliationMatch}){
  const {finance}=useServices(),[ack,setAck]=useState(false),[error,setError]=useState(''),key=useRef<string|null>(null),locked=useRef(false),completed=useRef(false),mutation=useFinanceMutation<C.ReconciliationReverse>(input=>finance.reverseReconciliation(match.id,input));
  return <div><p>Desfazer preserva o histórico e não cancela nem modifica o lançamento financeiro.</p><label className="inbox-ack"><input type="checkbox" checked={ack} disabled={mutation.isPending} onChange={e=>setAck(e.target.checked)}/>Quero desfazer somente esta conferência.</label><div className="ui-form-feedback" aria-live="polite">{error&&<Feedback>{error}</Feedback>}</div><Button variant="outline" disabled={!ack||mutation.isPending||mutation.isSuccess} onClick={async()=>{if(completed.current||locked.current)return;locked.current=true;setError('');key.current??=crypto.randomUUID();try{await mutation.mutateAsync({idempotencyKey:key.current});completed.current=true;}catch{setError('Não foi possível concluir a reversão. Atualize ou tente novamente.');}finally{locked.current=false;}}}>{mutation.isPending?'Desfazendo…':'Desfazer conciliação'}</Button></div>;
}
function Review({id,accountId,zone}:{id:string;accountId:string;zone:string}){
  const {finance}=useServices(),query=useReconciliationQuery('review',id,signal=>finance.reconciliationReview(id,signal));
  if(query.isPending)return <LoadingSkeleton label="Revisando evidência…"/>;
  if(query.isError)return <ErrorState retry={()=>void query.refetch()}>Evidência indisponível. Confira a conta, sessão e referência.</ErrorState>;
  const r=query.data,e=r.evidence;
  if(e.accountId!==accountId)return <Feedback>Esta evidência pertence a outra conta. Selecione a conta correta antes de revisar.</Feedback>;
  return <DataSection aria-label="Revisar conciliação"><SectionHeader title="Revisar conciliação"/><h3>{e.description}</h3><p>{formatMoney(e.amountMinor,e.currency)} · {displayDate(e.occurredAt,zone)}</p><Badge>{reconciliationLabels[r.classification]}</Badge><p>{reconciliationNotice}</p>
    {r.managed&&<Feedback>Conta gerenciada: preserve o fluxo específico de Cartões ou Dívidas. Nenhuma ação contábil será contornada.</Feedback>}
    {(r.suggestionsTruncated||r.originsTruncated)&&<Feedback>A consulta atingiu o limite de resultados. A lista não comprova uma correspondência única.</Feedback>}
    {r.classification==='AMBIGUOUS'&&<p role="status">Há múltiplas possibilidades ou resultados incompletos. Revise uma possível duplicidade; isso não comprova que existam lançamentos duplicados.</p>}
    <details><summary>Origem e rastreabilidade</summary><ul>{r.origins.map(o=><li key={o.batchId+':'+o.rowNumber}>Linha {o.rowNumber} · {o.format} · <Link className="ui-text-link" to={'/finance/inbox/import?batch='+o.batchId}>{o.fileName}</Link>{o.candidateId&&<> · <Link className="ui-text-link" to={'/finance/inbox?candidate='+o.candidateId}>Proposta {o.candidateStatus==='PENDING'?'pendente — fora do saldo':o.candidateStatus==='DISCARDED'?'descartada':o.candidateStatus==='CONFIRMED'?'confirmada':'indisponível'}</Link></>}</li>)}</ul></details>
    {e.match?<><MatchState match={e.match}/>{!e.match.valid&&<Feedback>O vínculo foi invalidado por alteração ou cancelamento do lançamento. Desfaça a conferência incorreta; o lançamento original será preservado.</Feedback>}<Reverse key={e.match.id} match={e.match}/></>:<ConfirmReview key={id} review={r} zone={zone}/>}
    <div className="ui-actions"><Link className="ui-text-link" to="/finance/cards">Cartões</Link><Link className="ui-text-link" to="/finance/debts">Dívidas</Link><Link className="ui-text-link" to="/finance/transactions">Fluxos financeiros oficiais</Link></div>
  </DataSection>;
}
export function ReconciliationPage(){
  const accounts=useAccounts(),me=useMe(),[params,setParams]=useSearchParams(),[view,setView]=useState<View>('evidence'),[q,setQ]=useState<C.ReconciliationQuery|null>(null),zone=me.data?.profile?.timezone??'UTC';
  const raw=params.get('accountId')??'',accountId=z.uuid().safeParse(raw).success?raw:'',rawEvidence=params.get('evidence')??'',evidenceId=z.uuid().safeParse(rawEvidence).success?rawEvidence:'';
  const from=localDateTime(new Date().toISOString(),zone).slice(0,7)+'-01T00:00',next=new Date(from.slice(0,10)+'T12:00:00Z');next.setUTCMonth(next.getUTCMonth()+1);const to=next.toISOString().slice(0,10)+'T00:00';
  const filters=q?.accountId===accountId?q:null,open=(id:string)=>setParams({accountId,evidence:id});
  let defaultQuery:C.ReconciliationQuery|null=null;try{if(accountId){const data=new FormData();for(const [key,value] of [['accountId',accountId],['from',from],['to',to],['status','ALL']])data.set(key!,value!);defaultQuery=reconciliationFilters(data,zone);}}catch{/* Explicit filters below handle a nonexistent local midnight. */}
  const active=me.isPending?null:filters??defaultQuery;
  const links:ReactNode=<div className="ui-actions"><Link className="ui-text-link" to="/finance/inbox">Caixa de Entrada</Link><Link className="ui-text-link" to="/finance/inbox/import">Importar extrato</Link></div>;
  return <><PageHeader title="Conciliação financeira" description={reconciliationNotice} actions={links}/><p>Confira evidências preservadas, propostas e lançamentos separadamente. Ausência de evidência não comprova ausência no extrato. Dados antigos podem estar incompletos após a expiração da prévia.</p>
    {(accounts.isPending||me.isPending)?<LoadingSkeleton label="Carregando contas…"/>:accounts.isError?<ErrorState retry={()=>void accounts.refetch()}>Contas indisponíveis.</ErrorState>:<FormPanel aria-label="Filtros de conciliação"><SectionHeader title="Conta e período"/><FinanceForm key={accountId+zone} reset={false} button="Aplicar filtros" successMessage="Filtros aplicados." submit={async data=>{const value=reconciliationFilters(data,zone);setQ(value);setParams({accountId:value.accountId});}}><Field label="Conta para conferência" name="accountId" required defaultValue={accountId}><option value="">Escolha uma conta</option>{accounts.data.map(a=><option key={a.id} value={a.id}>{a.name} · {a.currency}{!a.isActive?' (inativa — histórico)':''}</option>)}</Field><Field label="Início do período" type="datetime-local" name="from" defaultValue={from} required/><Field label="Fim do período (exclusivo)" type="datetime-local" name="to" defaultValue={to} required/><Field label="Estado da conferência" name="status" defaultValue="ALL"><option value="ALL">Todos</option><option value="RECONCILED">Com vínculo de conciliação</option><option value="UNRECONCILED">Sem vínculo ativo</option></Field></FinanceForm></FormPanel>}
    <DataSection aria-label="Como preservar evidências"><SectionHeader title="Evidência não é lançamento"/><p>Na prévia de Importar extrato, selecione linhas válidas e use “Preservar selecionadas para conciliação”. Essa ação explícita mantém os dados normalizados no histórico de conferência, sem guardar o arquivo ou criar propostas. Prévia expirada exige reenvio pelo usuário; receipts históricos não serão reinterpretados.</p>{links}</DataSection>
    {raw&&!accountId&&<Feedback>Referência de conta inválida.</Feedback>}{rawEvidence&&!evidenceId&&<Feedback>Referência de evidência inválida.</Feedback>}
    {active&&<><div className="ui-actions" role="group" aria-label="Visões de conciliação">{([['evidence','Evidências'],['movements','Movimentos'],['proposals','Propostas importadas'],['history','Histórico']] as const).map(([key,label])=><Button key={key} variant={view===key?'default':'outline'} aria-pressed={view===key} onClick={()=>setView(key)}>{label}</Button>)}</div><Rows key={JSON.stringify([active,view])} q={active} view={view} zone={zone} open={open}/>{evidenceId&&<Review key={accountId+evidenceId} id={evidenceId} accountId={accountId} zone={zone}/>}</>}
  </>;
}
