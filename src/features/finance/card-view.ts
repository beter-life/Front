import type { BillingRule, Currency } from './contracts.generated';
import { parseMoney } from './money';
import { validCivilDate } from './recurrence-view';
export function installmentPreview(raw: string, currency: Currency, count: number, date: string, rules: BillingRule[] = []) {
  const total = BigInt(parseMoney(raw, currency));
  if (!Number.isInteger(count) || count < 1 || count > 60 || total < BigInt(count) || !validCivilDate(date)) throw Error('Informe data, total e 1 a 60 parcelas positivas.');
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const month = (offset: number, day: number) => { const n = y * 12 + m - 1 + offset, year = Math.floor(n / 12), mon = n % 12 + 1; return `${year}-${String(mon).padStart(2, '0')}-${String(Math.min(day, new Date(Date.UTC(year, mon, 0)).getUTCDate())).padStart(2, '0')}`; };
  return Array.from({ length: count }, (_, i) => {
    const scheduledDate = month(i, d), rule = rules.find(r => r.effectiveFrom <= scheduledDate && (!r.effectiveTo || scheduledDate < r.effectiveTo));
    let closingDate: string | null = null, dueDate: string | null = null;
    if (rule) { let closeOffset = i; closingDate = month(closeOffset, rule.closingDay); if (scheduledDate > closingDate) closingDate = month(++closeOffset, rule.closingDay); dueDate = month(closeOffset, rule.dueDay); if (dueDate <= closingDate) dueDate = month(closeOffset + 1, rule.dueDay); }
    return { installmentNumber: i + 1, amountMinor: String(total / BigInt(count) + (i === count - 1 ? total % BigInt(count) : 0n)), scheduledDate, closingDate, dueDate };
  });
}
export const invoiceLabels = { UPCOMING: 'Próxima', OPEN: 'Aberta', CLOSED: 'Fechada', PAID: 'Paga', OVERDUE: 'Vencida' } as const;
export function requestKey(previous: { signature: string; key: string } | null, payload: unknown) { const signature = JSON.stringify(payload); return previous?.signature === signature ? previous : { signature, key: crypto.randomUUID() }; }
