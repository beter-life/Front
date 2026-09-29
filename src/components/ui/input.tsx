import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';
export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-slot="input" className={cn('flex h-12 w-full rounded-lg border border-input bg-card px-3.5 text-base text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive', className)} {...props} />;
}
