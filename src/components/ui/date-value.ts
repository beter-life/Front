/** Calendar presentation only: civil strings never pass through UTC parsing. */
export function calendarDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
  if (!match) return;
  const [, year, month, day] = match.map(Number);
  const date = new Date(0);
  date.setHours(12, 0, 0, 0);
  date.setFullYear(year!, month! - 1, day!);
  if (date.getFullYear() !== year || date.getMonth() !== month! - 1 || date.getDate() !== day) return;
  return date;
}
export function calendarValue(date: Date, type: 'date' | 'datetime-local', previous: string) {
  const civil = `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return type === 'date' ? civil : civil + 'T' + (previous.split('T')[1] || '00:00');
}
export function calendarToday(timeZone: string, instant = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(instant);
  const part = (name: string) => parts.find(value => value.type === name)!.value;
  return calendarDate(`${part('year')}-${part('month')}-${part('day')}`)!;
}
