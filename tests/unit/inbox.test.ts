import { describe,it,expect } from 'vitest';
import { InboxCreateSchema,InboxEditSchema,InboxReviewSchema } from '../../src/features/finance/contracts.generated';
import { inboxDraftFromForm } from '../../src/features/finance/inbox-view';
import { inboxReview } from '../fixtures/inbox';
describe('Inbox generated contracts and presentation input',()=>{
  it('uses exact minor units and the profile timezone; incomplete proposals stay nullable',()=>{
    const data=new FormData();for(const [key,value] of Object.entries({description:' Compra ',type:'EXPENSE',currency:'BRL',amount:'12,34',occurredAt:'2026-10-15T09:00'}))data.set(key,value);
    expect(inboxDraftFromForm(data,'America/Sao_Paulo')).toMatchObject({description:'Compra',amountMinor:'1234',occurredAt:'2026-10-15T12:00:00.000Z',accountId:null,categoryId:null});
    data.set('amount','');data.set('occurredAt','');expect(inboxDraftFromForm(data,'UTC')).toMatchObject({amountMinor:null,occurredAt:null});
  });
  it('rejects owner/status/ledger injection and requires explicit concurrency and idempotency fields',()=>{
    const {candidate}=inboxReview;const draft={description:candidate.description,type:candidate.type,currency:candidate.currency,accountId:null,categoryId:null,amountMinor:null,occurredAt:null};
    const input={...draft,idempotencyKey:candidate.id};expect(InboxCreateSchema.safeParse(input).success).toBe(true);
    for(const extra of [{ownerId:candidate.id},{auth_user_id:candidate.id},{status:'CONFIRMED'},{transactionId:candidate.id}])expect(InboxCreateSchema.safeParse({...input,...extra}).success).toBe(false);
    expect(InboxCreateSchema.safeParse(draft).success).toBe(false);expect(InboxEditSchema.safeParse(draft).success).toBe(false);
    expect(InboxReviewSchema.safeParse(inboxReview).success).toBe(true);
  });
  it.each([['JPY','123','123'],['KWD','1.234','1234'],['BRL','90071992547409.93','9007199254740993']])('keeps %s precise', (currency,amount,expected)=>{
    const data=new FormData();for(const [key,value] of Object.entries({description:'Exact',type:'INCOME',currency,amount}))data.set(key,value);expect(inboxDraftFromForm(data,'UTC').amountMinor).toBe(expected);
  });
});
