import type { ReconciliationReview,ReconciliationQuery } from './contracts.generated';
import { ReconciliationQuerySchema } from './contracts.generated';
import { toInstant } from './dates';
export const reconciliationNotice='Conciliar é conferir um lançamento já existente. Esta ação não cria receita, despesa ou transferência e não altera seu saldo.';
export const reconciliationLabels:Record<ReconciliationReview['classification'],string>={PROVEN_LINK:'Origem comprovada por vínculo persistente',SUGGESTED:'Correspondência sugerida — revisão necessária',AMBIGUOUS:'Correspondência ambígua — escolha após conferir',NO_MATCH:'Sem correspondência nos dados consultados',CONFLICT:'Conciliação conflitante ou invalidada',RECONCILED:'Conciliado — lançamento conferido'};
export function reconciliationFilters(data:FormData,zone:string):ReconciliationQuery{
  const from=toInstant(String(data.get('from')??''),zone),to=toInstant(String(data.get('to')??''),zone),days=(Date.parse(to)-Date.parse(from))/86400000;
  if(days<=0||days>366)throw Error('Escolha um período de até 366 dias, com término posterior ao início.');
  return ReconciliationQuerySchema.parse({accountId:String(data.get('accountId')??''),from,to,status:String(data.get('status')??'ALL')});
}
