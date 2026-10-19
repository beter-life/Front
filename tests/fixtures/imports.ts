import type { ImportBatch,ImportMapping,ImportPreview,InboxItem,ImportUpload } from '../../src/features/finance/contracts.generated';
import { bankAccount } from './cards';
import { inboxItem } from './inbox';
export const importBatch:ImportBatch={id:'77777777-7777-4777-8777-777777777777',fileName:'synthetic.csv',format:'CSV',fileSize:130,version:1,rowCount:2,importedCount:0,status:'NEEDS_MAPPING',mapping:null,issues:[],accountHint:null,createdAt:'2026-10-16T12:00:00Z',expiresAt:'2026-10-17T12:00:00Z'};
export const syntheticCsv='data;descricao;valor\n16/10/2026;Mercado sintetico;-12,34\n16/10/2026;Receita sintetica;150,00\n';
export function importBoundary(){
  const state={batch:structuredClone(importBatch),uploaded:false,duplicate:false,invalid:false,fail:false,uploadFail:false,linksFail:false,expired:false,writes:[] as {path:string;method:string;body:Record<string,unknown>}[],candidates:[] as InboxItem[],corePosts:0};
  function reply(path:string,method='GET',body:Record<string,unknown>={},search=new URLSearchParams()):{json:unknown;status:number}{
    const ok=(json:unknown,status=200)=>({json,status});
    if(path.endsWith('/accounts'))return ok([bankAccount]);if(path.endsWith('/categories'))return ok([]);if(path.endsWith('/cards')||path.endsWith('/debts'))return ok(state.linksFail?{}:[],state.linksFail?503:200);
    if(path.startsWith('/api/v1/finance/inbox')){
      if(path.endsWith('/inbox'))return ok({items:state.candidates,nextCursor:null});
      const candidate=state.candidates.find(c=>path.includes(c.id));if(!candidate)return ok({},404);
      if(path.endsWith('/confirm')){state.writes.push({path,method,body});if(candidate.status==='PENDING'){state.corePosts++;candidate.status='CONFIRMED';candidate.version++;candidate.transactionId='99999999-9999-4999-8999-999999999999';candidate.processedAt='2026-10-16T13:00:00Z';}return ok(candidate);}
      return ok({candidate,canConfirm:candidate.status==='PENDING',issues:[],duplicates:[],duplicatesTruncated:false});
    }
    if(!path.startsWith('/api/v1/finance/imports'))throw Error('Unexpected financial boundary '+path);
    if(method!=='GET')state.writes.push({path,method,body});
    if(state.fail)return ok({},503);
    if(method==='POST'&&path.endsWith('/imports')){
      if(state.uploadFail)return ok({},503);const input=body as unknown as ImportUpload;state.uploaded=true;state.batch.fileName=input.fileName;state.batch.format=input.format;return ok(state.batch,201);
    }
    if(path.endsWith('/mapping')){const {expectedVersion:_,...mapping}=body;void _;state.batch.mapping=mapping as ImportMapping;state.batch.status='READY';state.batch.version++;return ok(state.batch);}
    if(path.endsWith('/inbox')){const numbers=body.rowNumbers as number[];const items=numbers.map(n=>{const id=n===1?inboxItem.id:'66666666-6666-4666-8666-666666666666',previous=state.candidates.find(c=>c.id===id);if(!previous)state.candidates.push({...inboxItem,id,source:('FILE_'+state.batch.format) as InboxItem['source'],description:n===1?'Mercado sintetico':'Receita sintetica',type:n===1?'EXPENSE':'INCOME',amountMinor:n===1?'1234':'15000',categoryId:null,occurredAt:'2026-10-16T15:00:00Z'});return {rowNumber:n,candidateId:id,reused:!!previous};});state.batch.importedCount=state.candidates.length;state.batch.version++;if(state.batch.importedCount===2)state.batch.status='IMPORTED';return ok({batchId:state.batch.id,items});}
    if(path.endsWith('/imports'))return ok({items:state.uploaded?[state.batch]:[],nextCursor:null});
    if(search.get('offset')==='50')return ok({batch:state.batch,headers:[],rows:[],nextOffset:null});
    const batch={...state.batch,...(state.expired?{status:'EXPIRED' as const}:{})};
    const preview:ImportPreview={batch,headers:['data','descricao','valor'],rows:[1,2].map(n=>{
      const candidate=state.candidates.find(c=>c.id===(n===1?inboxItem.id:'66666666-6666-4666-8666-666666666666'));
      return {rowNumber:n,cells:state.expired?[]:['16/10/2026',n===1?'Mercado sintetico':'Receita sintetica',n===1?'-12,34':'150,00'],draft:state.batch.mapping&&!state.expired&&!(state.invalid&&n===2)?{description:n===1?'Mercado sintetico':'Receita sintetica',type:n===1?'EXPENSE' as const:'INCOME' as const,currency:'BRL' as const,accountId:bankAccount.id,categoryId:null,amountMinor:n===1?'1234':'15000',occurredAt:'2026-10-16T15:00:00Z'}:null,issues:state.invalid&&n===2?['AMOUNT_INVALID' as const]:[],candidateId:candidate?.id??null,duplicate:candidate?'PROVEN' as const:state.duplicate?'POSSIBLE' as const:'NONE' as const};}),nextOffset:null};return ok(preview);
  }
  return {state,reply};
}
