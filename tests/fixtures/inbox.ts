import type { InboxItem, InboxReview } from '../../src/features/finance/contracts.generated';
import { bankAccount, expenseCategory } from './cards';
export const inboxItem:InboxItem={id:'88888888-8888-4888-8888-888888888888',source:'MANUAL',status:'PENDING',version:1,
  description:'Proposta teste',type:'EXPENSE',currency:'BRL',accountId:bankAccount.id,categoryId:expenseCategory.id,
  amountMinor:'1200',occurredAt:'2026-10-15T12:00:00Z',transactionId:null,createdAt:'2026-10-15T12:00:00Z',updatedAt:'2026-10-15T12:00:00Z',processedAt:null};
export const inboxReview:InboxReview={candidate:inboxItem,canConfirm:true,issues:[],duplicates:[],duplicatesTruncated:false};
