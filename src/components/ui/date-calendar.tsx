import { useContext } from 'react';
import { DayPicker } from '@daypicker/react';
import { ptBR, enUS, es } from '@daypicker/react/locale';
import '@daypicker/react/style.css';
import { CalendarPreferences } from './calendar-preferences';
import { calendarDate, calendarToday } from './date-value';

export default function DateCalendar({ value, min, max, onSelect }: { value: string; min?: string; max?: string; onSelect: (date: Date) => void }) {
  const preferences = useContext(CalendarPreferences);
  const today = calendarToday(preferences.timeZone), selected = calendarDate(value);
  const minimum = calendarDate(min ?? ''), maximum = calendarDate(max ?? '');
  let opening = selected ?? today;
  if (minimum && opening < minimum) opening = minimum;
  if (maximum && opening > maximum) opening = maximum;
  const locale = preferences.locale.startsWith('en') ? enUS : preferences.locale.startsWith('es') ? es : ptBR;
  return <DayPicker className="date-calendar" mode="single" required autoFocus locale={locale} today={today}
    defaultMonth={opening} selected={selected} onSelect={date => { if (date) onSelect(date); }}
    startMonth={minimum} endMonth={maximum} disabled={[...(minimum ? [{ before: minimum }] : []), ...(maximum ? [{ after: maximum }] : [])]}
    showOutsideDays fixedWeeks labels={{ labelNext: () => 'Próximo mês', labelPrevious: () => 'Mês anterior' }} />;
}
