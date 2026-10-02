const parts = (date: Date, timezone: string) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
export function localDateTime(iso: string, timezone: string) {
  const values = Object.fromEntries(
    parts(new Date(iso), timezone).map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}
export function toInstant(local: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))
    throw new Error('Informe data e hora válidas.');
  const wall = Date.parse(local + ':00Z');
  if (!Number.isFinite(wall)) throw new Error('Informe data e hora válidas.');
  if (new Date(wall).toISOString().slice(0, 16) !== local)
    throw new Error('Informe data e hora válidas.');
  let instant = wall;
  for (let i = 0; i < 4; i++) {
    const rendered = localDateTime(new Date(instant).toISOString(), timezone);
    const difference = wall - Date.parse(rendered + ':00Z');
    if (difference === 0) return new Date(instant).toISOString();
    instant += difference;
  }
  throw new Error('Este horário não existe no seu fuso. Escolha outro horário.');
}
export function displayDate(iso: string, timezone: string, locale = 'pt-BR') {
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}
