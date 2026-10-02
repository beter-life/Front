import type { Currency } from './contracts.generated';
import { currencyDigits } from './contracts.generated';
export function validBudgetMonth(value: string) {
  return /^[1-9][0-9]{3}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) <= 9998;
}
export function currentBudgetMonth(zone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  return (
    parts.find((p) => p.type === 'year')!.value.padStart(4, '0') +
    '-' +
    parts.find((p) => p.type === 'month')!.value
  );
}
export function shiftBudgetMonth(month: string, delta: -1 | 1) {
  const date = new Date(0);
  date.setUTCFullYear(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + delta, 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
export function budgetMonthLabel(month: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(month + '-15T12:00:00Z'));
}
export function budgetAmountInput(amount: string, currency: Currency) {
  const minor = BigInt(amount);
  const digits = currencyDigits[currency];
  const scale = 10n ** BigInt(digits);
  return String(minor / scale) + (digits ? '.' + String(minor % scale).padStart(digits, '0') : '');
}
export function budgetPercentLabel(value: string | null, locale = 'pt-BR') {
  if (value === null) return 'Sem limite disponível';
  const [whole, fraction] = value.split('.');
  const decimal = new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((p) => p.type === 'decimal')!.value;
  return (
    new Intl.NumberFormat(locale).format(BigInt(whole!)) +
    (fraction === '00' ? '' : decimal + fraction) +
    '%'
  );
}
export function budgetProgress(value: string | null) {
  if (value === null) return 0;
  const [whole, fraction] = value.split('.');
  if (BigInt(whole!) >= 100n) return 100;
  return Number(whole) + Number(fraction) / 100;
}
