import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const variants = cva('ui-button', {
  variants: {
    variant: { default: 'ui-primary', outline: 'ui-secondary', secondary: 'ui-secondary', ghost: 'ui-ghost', destructive: 'ui-destructive' },
    size: { default: '', compact: 'ui-button-compact', large: 'ui-button-large' },
  }, defaultVariants: { variant: 'default', size: 'default' },
});
export function Button({ className, variant, size, asChild = false, ...props }: ComponentProps<'button'> & VariantProps<typeof variants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button';
  return <Component data-slot="button" className={cn(variants({ variant, size, className }))} {...props} />;
}
