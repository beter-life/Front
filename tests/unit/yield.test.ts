import { describe,it,expect,vi } from 'vitest';
import { percentToDecimal,decimalPercent,yieldRuleLabel,yieldRulePayload } from '../../src/features/finance/yield-view';
import { YieldRuleInputSchema } from '../../src/features/finance/contracts.generated';
import { createFinanceApi } from '../../src/features/finance/api';
import { createApiClient } from '../../src/api/client';
import { yieldEstimate,yieldProfile } from '../fixtures/yield';
describe('yield exact rates and contracts',()=>{
 it('normalizes percentages without float, annual/monthly/benchmark explicit',()=>{expect(percentToDecimal('115')).toBe('1.15');expect(percentToDecimal('0,8')).toBe('0.008');expect(percentToDecimal('10.5')).toBe('0.105');expect(decimalPercent('0.1365')).toBe('13,65');expect(decimalPercent('1')).toBe('100');expect(()=>percentToDecimal('NaN')).toThrow();expect(()=>percentToDecimal('1e2')).toThrow();});
 it.each(['CDI','SELIC','FIXED_RATE','SAVINGS_BR','ZERO'] as const)('builds precise %s payload without owners',type=>{const input=yieldRulePayload({type,date:'2026-10-05',rate:'115',period:'ANNUAL',calendar:'CALENDAR_365',tax:'NONE',delay:'0',capMinor:null,taxDate:''});expect(YieldRuleInputSchema.safeParse(input).success).toBe(true);expect(input).not.toHaveProperty('ownerId');if(type==='CDI'||type==='SELIC')expect(input.benchmarkPercentage).toBe('1.15');if(type==='SAVINGS_BR')expect(input.taxTreatment).toBe('BR_SAVINGS_EXEMPT');});
 it('schema rejects client owner and unsafe executable/rate fields',()=>{expect(YieldRuleInputSchema.safeParse({...yieldProfile().rules[0],ownerId:'x'}).success).toBe(false);expect(yieldRuleLabel(yieldProfile().rules[0]!)).toBe('10% a.a.');});
 it('transport estimates are GET and only configuration writes yield routes',async()=>{const calls:{url:string;method:string;body:unknown}[]=[];const request=vi.fn<typeof fetch>(async(url,o)=>{calls.push({url:String(url),method:o!.method!,body:o?.body?JSON.parse(String(o.body)):null});return Response.json(String(url).includes('/estimate')?yieldEstimate:yieldProfile());});const api=createFinanceApi(createApiClient('http://localhost:3001',()=> 'synthetic-token',async()=>{},request));await api.yieldEstimate(yieldProfile().accountId,{to:'2027-10-05'});expect(calls[0]?.method).toBe('GET');expect(calls[0]?.url).toContain('/yield/estimate');});
});
