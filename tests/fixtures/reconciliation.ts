import type * as C from '../../src/features/finance/contracts.generated';
import { bankAccount } from './cards';
import { inboxItem } from './inbox';
import { importBatch } from './imports';
export const evidenceId='12121212-1212-4212-8212-121212121212',transactionId='13131313-1313-4313-8313-131313131313',matchId='14141414-1414-4414-8414-141414141414';
export const statementEvidence:C.ReconciliationEvidence={id:evidenceId,accountId:bankAccount.id,currency:'BRL',type:'EXPENSE',amountMinor:'1234',description:'Synthetic statement evidence',occurredAt:'2026-10-16T15:00:00Z',createdAt:'2026-10-19T12:00:00Z',match:null};
export const reconciliationTransaction:C.Transaction={id:transactionId,accountId:bankAccount.id,destinationAccountId:null,categoryId:null,type:'EXPENSE',currency:'BRL',amountMinor:'1234',description:'Synthetic ledger movement',occurredAt:statementEvidence.occurredAt,createdAt:'2026-10-16T15:00:00Z',updatedAt:'2026-10-16T15:00:00Z',isCancelled:false};
export function reconciliationBoundary(){
  const state={match:null as C.ReconciliationMatch|null,history:[] as C.ReconciliationMatch[],ambiguous:false,dateDifference:false,amountDifference:false,cancelled:false,conflicting:false,managed:false,invalidated:false,fail:false,postFail:false,unauthorized:false,empty:false,writes:[] as {path:string;body:Record<string,unknown>}[]};
  function reply(path:string,method='GET',body:Record<string,unknown>={},params=new URLSearchParams()):{json:unknown;status:number}{
    const ok=(json:unknown,status=200)=>({json,status});
    if(path.endsWith('/accounts'))return ok([bankAccount]);if(path.endsWith('/cards')||path.endsWith('/debts')||path.endsWith('/categories'))return ok([]);
    if(!path.startsWith('/api/v1/finance/reconciliation'))throw Error('Unexpected reconciliation boundary '+path);
    if(method==='POST')state.writes.push({path,body});
    if(state.unauthorized)return ok({error:{code:'AUTH_INVALID_TOKEN',message:'Invalid or expired access token.',requestId:'synthetic-reconciliation'}},401);if(state.fail||state.postFail&&method==='POST')return ok({},503);
    if(path.endsWith('/matches')){state.match??={id:matchId,evidenceId,transactionId:String(body.transactionId),idempotencyKey:String(body.idempotencyKey),dateAcknowledged:body.acknowledgeDateDifference===true,createdAt:'2026-10-19T12:00:00Z',reversedAt:null,valid:true};if(!state.history.some(h=>h.id===state.match!.id))state.history.push(structuredClone(state.match));return ok(state.match);}
    if(path.endsWith('/reverse')){const previous=state.history.find(h=>path.includes(h.id));if(previous)previous.reversedAt='2026-10-19T12:05:00Z';const result={...state.match!,reversedAt:'2026-10-19T12:05:00Z'};state.match=null;return ok(result);}
    if(method==='POST'&&path.endsWith('/evidence'))return ok({evidenceIds:[evidenceId]});
    const evidence={...statementEvidence,match:state.match?{...state.match,valid:!state.invalidated}:null};
    const t={...reconciliationTransaction,isCancelled:state.cancelled,amountMinor:state.amountDifference?'1235':'1234',occurredAt:state.dateDifference?'2026-10-17T15:00:00Z':reconciliationTransaction.occurredAt};
    if(path.endsWith('/evidence/'+evidenceId)){
      const suggestion:C.ReconciliationSuggestion={transaction:t,provenLink:!state.dateDifference&&!state.amountDifference&&!state.cancelled,compatible:!state.amountDifference&&!state.cancelled&&!state.managed,dateDifference:state.dateDifference,amountDifference:state.amountDifference,cancelled:state.cancelled,conflicting:state.conflicting,managed:state.managed};
      const review:C.ReconciliationReview={evidence,origins:[{batchId:importBatch.id,rowNumber:1,fileName:'synthetic.csv',format:'CSV',candidateId:inboxItem.id,candidateStatus:'CONFIRMED',transactionId}],originsTruncated:false,suggestions:[suggestion,...(state.ambiguous?[{...suggestion,transaction:{...t,id:'15151515-1515-4515-8515-151515151515',description:'Synthetic alternative movement'}}]:[])],suggestionsTruncated:false,classification:state.match?(state.invalidated?'CONFLICT':'RECONCILED'):state.ambiguous?'AMBIGUOUS':state.dateDifference?'SUGGESTED':'PROVEN_LINK',managed:state.managed};return ok(review);
    }
    const visible=params.get('status')==='RECONCILED'?!!state.match:params.get('status')==='UNRECONCILED'?!state.match:true;
    if(path.endsWith('/evidence'))return ok({items:state.empty||!visible?[]:[evidence],nextCursor:null});
    if(path.endsWith('/movements'))return ok({items:state.empty?[]:[{transaction:t,match:evidence.match}],nextCursor:null});
    if(path.endsWith('/proposals'))return ok({items:state.empty?[]:[{candidate:{...inboxItem,source:'FILE_CSV',status:'PENDING',transactionId:null,processedAt:null},batchId:importBatch.id,rowNumber:1}],nextCursor:null});
    if(path.endsWith('/history'))return ok({items:state.history,nextCursor:null});
    return ok({},404);
  }
  return {state,reply};
}
