import { describe,it,expect } from 'vitest';
import { eligibleSafeAccounts,safeSpendWarnings } from '../../src/features/finance/safe-spend-view';
import { SafeSpendSettingsInputSchema,SafeSpendViewSchema } from '../../src/features/finance/contracts.generated';
import { bankAccount,cardAccount } from '../fixtures/cards';
import { safeSettings,safeView } from '../fixtures/safe-spend';
describe('Safe Spend generated contract and liquid selection',()=>{
  it('eligible types only, no automatic savings/investment/credit/debt or currency mix',()=>{const accounts=[bankAccount,cardAccount,{...bankAccount,id:'inactive',isActive:false},{...bankAccount,id:'USD',currency:'USD' as const},{...bankAccount,id:'investment',type:'investment' as const},{...bankAccount,id:'debt',type:'debt' as const}];expect(eligibleSafeAccounts(accounts,'BRL')).toEqual([bankAccount]);});
  it('strict settings forbid owner, no accounts, duplicate account, negative buffer',()=>{const {id:unusedId,createdAt:unusedCreated,updatedAt:unusedUpdated,...input}=safeSettings;void unusedId;void unusedCreated;void unusedUpdated;expect(SafeSpendSettingsInputSchema.safeParse(input).success).toBe(true);for(const extra of [{ownerId:'owner'},{accountIds:[]},{accountIds:[bankAccount.id,bankAccount.id]},{safetyBufferMinor:'-1'}])expect(SafeSpendSettingsInputSchema.safeParse({...input,...extra}).success).toBe(false);});
  it('exact aggregate strings, source certainty, neutral warnings; no JSON numbers',()=>{expect(SafeSpendViewSchema.safeParse(safeView).success).toBe(true);expect(SafeSpendViewSchema.safeParse({...safeView,safeToSpendMinor:180000}).success).toBe(false);for(const warning of safeView.warnings)expect(safeSpendWarnings[warning]).toBeTruthy();});
});
