import type { ReactNode } from 'react';

/** Presentation only: nested native fields preserve names, validation and FormData. */
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <fieldset className="ui-form-section"><legend>{title}</legend>{description && <p className="ui-caption">{description}</p>}<div className="ui-form-grid">{children}</div></fieldset>;
}
