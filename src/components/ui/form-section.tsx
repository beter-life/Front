import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function FormGrid({ className, ...props }: ComponentProps<'div'>) { return <div {...props} className={cn('ui-form-grid', className)} />; }

/** Presentation only: nested native fields preserve names, validation and FormData. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <fieldset className="ui-form-section"><legend>{title}</legend>{description && <p className="ui-caption">{description}</p>}<FormGrid>{children}</FormGrid></fieldset>;
}
