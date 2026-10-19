import { describe,expect,it } from 'vitest';
import { reconciliationFilters,reconciliationLabels,reconciliationNotice } from '../../src/features/finance/reconciliation-view';
import { bankAccount } from '../fixtures/cards';
function form(from='2026-10-01T00:00',to='2026-11-01T00:00'){const d=new FormData();d.set('accountId',bankAccount.id);d.set('from',from);d.set('to',to);d.set('status','ALL');return d;}
describe('reconciliation presentation preserves accounting boundaries',()=>{
  it('uses explicit account/period and the profile timezone',()=>{expect(reconciliationFilters(form(),'America/Sao_Paulo')).toMatchObject({accountId:bankAccount.id,from:'2026-10-01T03:00:00.000Z',to:'2026-11-01T03:00:00.000Z'});});
  it('rejects invalid owner-free filters and excessively large periods',()=>{const d=form();d.set('accountId','bad');expect(()=>reconciliationFilters(d,'UTC')).toThrow();for(const [a,b] of [['2026-10-01T00:00','2026-10-01T00:00'],['2026-10-01T00:00','2028-10-01T00:00']])expect(()=>reconciliationFilters(form(a,b),'UTC')).toThrow();});
  it('distinguishes suggestions, proven links and explicit reconciliation',()=>{expect(reconciliationLabels.PROVEN_LINK).not.toBe(reconciliationLabels.RECONCILED);expect(reconciliationLabels.AMBIGUOUS).toContain('ambígua');expect(reconciliationNotice).toContain('não altera seu saldo');});
});
