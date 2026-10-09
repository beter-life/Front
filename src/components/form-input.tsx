import type { ComponentProps } from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
export function FormInput({ id, label, error, hint, ...props }: ComponentProps<'input'> & { id: string; label: string; error?: string; hint?: string }) {
  const description = [hint ? id + '-hint' : '', error ? id + '-error' : ''].filter(Boolean).join(' ') || undefined;
  return <div className="ui-field"><Label htmlFor={id}>{label}</Label><Input id={id} aria-invalid={!!error} aria-describedby={description} {...props} /><div className="ui-field-feedback" data-hint={!!hint}>{hint && <p id={id + '-hint'} className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}{error && <p id={id + '-error'} className="text-sm text-destructive">{error}</p>}</div></div>;
}
