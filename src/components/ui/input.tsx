import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';
import { DateInput } from './date-input';
export function Input({ className, calendarLabel, ...props }: ComponentProps<'input'> & { calendarLabel?: string }) {
  if (props.type === 'date' || props.type === 'datetime-local') return <DateInput {...props} calendarLabel={calendarLabel} className={className} />;
  return <input data-slot="input" className={cn('ui-control', className)} {...props} />;
}
