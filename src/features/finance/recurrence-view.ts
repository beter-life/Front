import type { Recurrence } from './contracts.generated';
export const frequencyLabels = { WEEKLY:'Semanal', MONTHLY:'Mensal', YEARLY:'Anual' } as const;
export const recurrenceStatusLabels = { ACTIVE:'Ativa', PAUSED:'Pausada', ARCHIVED:'Arquivada' } as const;
export const recurrenceTypeLabels = { INCOME:'Receita', EXPENSE:'Despesa' } as const;
export const recurrenceKindLabels = { STANDARD:'Recorrência', SUBSCRIPTION:'Assinatura' } as const;
export const intervalLimits = { WEEKLY:52, MONTHLY:24, YEARLY:10 } as const;
export function recurrencePeriod(row: Pick<Recurrence,'frequency'|'intervalCount'>) { return row.intervalCount === 1 ? frequencyLabels[row.frequency] : `A cada ${row.intervalCount} ${row.frequency === 'WEEKLY' ? 'semanas' : row.frequency === 'MONTHLY' ? 'meses' : 'anos'}`; }
export function validCivilDate(value:string) { const m=/^([1-9][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.exec(value); if(!m) return false; const year=Number(m[1]),month=Number(m[2]),day=Number(m[3]),leap=year%4===0&&(year%100!==0||year%400===0); return year<=9998&&day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1]!; }
export function civilDateLabel(value:string|null,locale='pt-BR') {
  if (!value) return 'Sem próxima ocorrência';
  const [year,month,day]=value.split('-');
  // Format the calendar components using a constant locale template. The projected date never becomes a timestamp.
  return new Intl.DateTimeFormat(locale,{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'UTC'}).formatToParts(new Date('2001-02-03T12:00:00Z')).map(p=>p.type==='year'?year:p.type==='month'?month:p.type==='day'?day:p.value).join('');
}
