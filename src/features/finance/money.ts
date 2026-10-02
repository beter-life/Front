import { currencyDigits } from './contracts.generated';
import type { Currency } from './contracts.generated';
const maxMinor = 9223372036854775807n;
export function parseMoney(raw: string, currency: Currency, positive = true): string {
  // Explicit decimal separator; ambiguous thousands separators are rejected, never rounded.
  const value = raw.trim();
  const digits = currencyDigits[currency];
  const match = /^(-?)(\d+)(?:[.,](\d+))?$/.exec(value);
  if (!match || (match[3]?.length ?? 0) > digits)
    throw new Error('Informe um valor válido para esta moeda, sem separador de milhar.');
  const minor =
    BigInt(match[2]!) * 10n ** BigInt(digits) + BigInt((match[3] ?? '').padEnd(digits, '0') || '0');
  const signed = match[1] ? -minor : minor;
  if (signed > maxMinor || signed < -maxMinor || (positive && signed <= 0n))
    throw new Error('O valor deve ser positivo e estar dentro do limite suportado.');
  return String(signed);
}
export function formatMoney(amountMinor: string, currency: Currency, locale = 'pt-BR'): string {
  const amount = BigInt(amountMinor);
  const digits = currencyDigits[currency];
  const scale = 10n ** BigInt(digits);
  const abs = amount < 0n ? -amount : amount;
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  // BigInt integer formatting keeps precision; patch only the exact fractional part.
  const whole = abs / scale;
  const template = amount < 0n ? -(whole || 1n) : whole;
  return formatter
    .formatToParts(template)
    .map((part) =>
      part.type === 'fraction'
        ? String(abs % scale).padStart(digits, '0')
        : part.type === 'integer' && amount < 0n && whole === 0n
          ? '0'
          : part.value,
    )
    .join('');
}
