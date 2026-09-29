import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const variants = cva('inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4', {
  variants: { variant: { default: 'bg-primary text-primary-foreground hover:bg-primary/90', outline: 'border border-border bg-card text-foreground hover:bg-muted', ghost: 'text-foreground hover:bg-muted' } }, defaultVariants: { variant: 'default' },
});
export function Button({ className, variant, asChild = false, ...props }: ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button';
  return <Component data-slot="button" className={cn(variants({ variant, className }))} {...props} />;
}
