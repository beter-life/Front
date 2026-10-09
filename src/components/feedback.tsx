import { LoaderCircle, CircleCheck, CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { LoadingSkeleton } from './ui/surface';
export function Loading({ children = 'Preparando seu espaço…' }: { children?: ReactNode }) { return typeof children === 'string' ? <LoadingSkeleton label={children} /> : <div role="status" className="flex items-center gap-3 py-8 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />{children}</div>; }
export function Feedback({ children, success = false }: { children: ReactNode; success?: boolean }) {
  const Icon = success ? CircleCheck : CircleAlert;
  return <div role={success ? 'status' : 'alert'} className={'ui-feedback' + (success ? ' success' : '')}><Icon aria-hidden="true" /><div>{children}</div></div>;
}
