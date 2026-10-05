import { describe,it,expect } from 'vitest';
import { chartCoordinates,historyStart,netWorthCategories } from '../../src/features/finance/net-worth-view';
import { parseMoney,formatMoney } from '../../src/features/finance/money';
describe('net worth presentation preserves exact money',()=>{
 it('spans 12 months across years',()=>{expect(historyStart('2026-10')).toBe('2025-11');expect(historyStart('2026-01')).toBe('2025-02');});
 it('only converts normalized chart coordinates, including huge negative totals',()=>{const points=chartCoordinates(['-18446744073709551614','0','18446744073709551614']);expect(points).toEqual([{x:10,y:90},{x:50,y:50},{x:90,y:10}]);expect(chartCoordinates([])).toEqual([]);expect(chartCoordinates(['0'])).toEqual([{x:50,y:90}]);});
 it('keeps 0/2/3 currency exponents and zero valuations exact',()=>{expect(parseMoney('12','JPY')).toBe('12');expect(parseMoney('12,34','BRL')).toBe('1234');expect(parseMoney('12,345','KWD')).toBe('12345');expect(parseMoney('0','BRL',false)).toBe('0');expect(()=>parseMoney('0','BRL')).toThrow();expect(formatMoney('9007199254740993','BRL')).toContain('90.071.992.547.409,93');});
 it('separates asset and liability categories',()=>{expect(netWorthCategories.ASSET).not.toContain('LOAN');expect(netWorthCategories.LIABILITY).not.toContain('VEHICLE');});
});
