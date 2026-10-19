import { InboxDraftSchema, type InboxDraft, type InboxIssue, type InboxStatus } from './contracts.generated';
import { parseMoney } from './money';
import { toInstant } from './dates';
export const inboxStatuses:Record<InboxStatus,string>={PENDING:'Pendente',CONFIRMED:'Confirmado',DISCARDED:'Descartado'};
export const inboxIssues:Record<InboxIssue,string>={ACCOUNT_REQUIRED:'Escolha uma conta antes de confirmar.',AMOUNT_REQUIRED:'Informe o valor antes de confirmar.',DATE_REQUIRED:'Informe a data e a hora antes de confirmar.',ACCOUNT_UNAVAILABLE:'A conta não está ativa ou não corresponde à moeda.',CATEGORY_UNAVAILABLE:'A categoria não está ativa ou não corresponde ao tipo.',MANAGED_ACCOUNT:'Use o fluxo de cartões ou dívidas para esta conta gerenciada.'};
export function inboxDraftFromForm(data:FormData,timeZone:string):InboxDraft {
  const currency=String(data.get('currency')) as InboxDraft['currency'];
  const amount=String(data.get('amount')??'').trim(),date=String(data.get('occurredAt')??'');
  return InboxDraftSchema.parse({description:String(data.get('description')??'').trim(),type:String(data.get('type')),currency,
    accountId:String(data.get('accountId')??'')||null,categoryId:String(data.get('categoryId')??'')||null,
    amountMinor:amount?parseMoney(amount,currency):null,occurredAt:date?toInstant(date,timeZone):null});
}
export const inboxSources={MANUAL:'Manual',FILE_CSV:'Arquivo CSV',FILE_OFX:'Arquivo OFX',FILE_PDF:'Arquivo PDF'};
