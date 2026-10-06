import { describe,it,expect } from 'vitest';
import { percentToRate,rateToPercent,paymentPreview } from '../../src/features/finance/debt-view';
import { DebtInputSchema,DebtSimulationInputSchema,DebtPaymentInputSchema } from '../../src/features/finance/contracts.generated';
import { debtFixture } from '../fixtures/debts';
describe('debt client exact input boundaries',()=>{
  it.each([['12','0.12'],['1','0.01'],['0','0'],['100','1'],['12,12345678','0.1212345678']])('percent %s becomes exact fraction %s',(percent,rate)=>{expect(percentToRate(percent)).toBe(rate);expect(rateToPercent(rate)).toBe(percent.replace(',','.'));});
  it.each(['-1','101','1e2','NaN','0.123456789'])('rejects invalid percentage %s',value=>expect(()=>percentToRate(value)).toThrow());
  it('preview reduces only principal, no floating-point or expense double counting',()=>expect(paymentPreview('400','90','10','1000000','BRL')).toEqual({totalMinor:'50000',remainingMinor:'960000'}));
  it('JPY and KWD use their own currency digits',()=>{expect(paymentPreview('40','9','1','1000','JPY')).toEqual({totalMinor:'50',remainingMinor:'960'});expect(paymentPreview('40.001','9.002','1.003','1000000','KWD')).toEqual({totalMinor:'50006',remainingMinor:'959999'});});
  it('overpayment and negative parts are rejected',()=>{expect(()=>paymentPreview('100.01','0','0','10000','BRL')).toThrow();expect(()=>paymentPreview('0','-1','0','10000','BRL')).toThrow();});
  it('strict DTOs reject owner, excess debt count and duplicate IDs',()=>{const input={debtIds:[debtFixture.id],strategy:'COMPARE',extraMonthlyMinor:'0'};expect(DebtSimulationInputSchema.safeParse(input).success).toBe(true);expect(DebtSimulationInputSchema.safeParse({...input,debtIds:[debtFixture.id,debtFixture.id]}).success).toBe(false);expect(DebtSimulationInputSchema.safeParse({...input,debtIds:Array.from({length:21},()=>crypto.randomUUID())}).success).toBe(false);expect(DebtPaymentInputSchema.safeParse({ownerId:'owner'}).success).toBe(false);expect(DebtInputSchema.safeParse({name:'x',ownerId:'owner'}).success).toBe(false);});
});
