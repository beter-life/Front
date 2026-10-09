import { lazy, Suspense, useId, useRef, useState, type ComponentProps } from 'react';
import { CalendarDays } from 'lucide-react';
import { Dialog } from './dialog';
import { calendarValue } from './date-value';
import { cn } from '../../lib/utils';
const DateCalendar = lazy(() => import('./date-calendar'));

export function DateInput({ ref, className, calendarLabel, ...props }: ComponentProps<'input'> & { calendarLabel?: string }) {
  const input = useRef<HTMLInputElement>(null), hint = useId();
  const [calendar, setCalendar] = useState<{ value: string; label: string } | null>(null);
  const label = calendarLabel ?? props['aria-label'] ?? 'data';
  const describedBy = [props['aria-describedby'], hint].filter(Boolean).join(' ');
  return <span className="date-control"><input {...props} aria-label={props['aria-label'] ?? calendarLabel} className={cn('ui-control', className)} aria-describedby={describedBy}
    ref={element => { input.current = element; if (typeof ref === 'function') ref(element); else if (ref) ref.current = element; }} />
    <button type="button" className="date-trigger" aria-label={'Abrir calendário: ' + label} aria-haspopup="dialog" aria-expanded={!!calendar}
      disabled={props.disabled || props.readOnly} onClick={() => {
        const field = input.current!;
        if (field.matches(':disabled')) return;
        const name = calendarLabel ?? props['aria-label'] ?? (props['aria-labelledby'] ? document.getElementById(props['aria-labelledby'])?.textContent : field.labels?.[0]?.textContent) ?? 'Data';
        setCalendar({ value: field.value, label: name.trim() });
      }}><CalendarDays aria-hidden="true" /></button>
    <span id={hint} className="sr-only">Dia, mês e ano{props.type === 'datetime-local' ? ', com hora e minutos' : ''}. Digite a data ou abra o calendário.</span>
    {calendar && <Dialog title={calendar.label} className="date-dialog" initialFocusSelector=".rdp-day[data-focused] button" returnFocus={input} onClose={() => setCalendar(null)}>
      <Suspense fallback={<p role="status">Carregando calendário…</p>}><DateCalendar value={calendar.value} min={String(props.min ?? '')} max={String(props.max ?? '')} onSelect={date => {
        const field = input.current!;
        const next = calendarValue(date, props.type === 'datetime-local' ? 'datetime-local' : 'date', field.value);
        const previous = field.value;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
        setter.call(field, next);
        if (!field.validity.rangeUnderflow && !field.validity.rangeOverflow) {
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          setCalendar(null);
        } else { setter.call(field, previous); }
      }} /></Suspense>
      <p className="date-keyboard-help">Use as setas para escolher o dia, Enter para selecionar e Escape para fechar.{props.type === 'datetime-local' && ' A hora é mantida; ajuste-a no campo.'}</p>
    </Dialog>}
  </span>;
}
