import type { ComponentProps, ReactNode } from 'react';
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';

export function PageHeader({ title, description, actions, status, breadcrumb }: { title: string; description?: string; actions?: ReactNode; status?: ReactNode; breadcrumb?: ReactNode }) {
  return <header className="ui-page-header">{breadcrumb}<div><h1 tabIndex={-1}>{title}</h1>{description && <p>{description}</p>}{status}</div>{actions && <div className="ui-actions">{actions}</div>}</header>;
}
export function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="ui-section-header"><h2>{title}</h2>{children}</div>;
}
export function IconButton({ label, children, ...props }: ComponentProps<typeof Button> & { label: string }) {
  return <Button variant="ghost" aria-label={label} title={label} {...props} className={cn('ui-icon-button', props.className)}>{children}</Button>;
}
export function Badge({ children }: { children: ReactNode }) { return <span className="ui-badge">{children}</span>; }
export function ActionToolbar({ children }: { children: ReactNode }) { return <div className="ui-actions">{children}</div>; }
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="ui-empty"><Inbox aria-hidden="true" /><h2>{title}</h2><p>{children}</p>{action}</section>;
}
export function ErrorState({ children, retry }: { children: ReactNode; retry: () => void }) {
  return <section className="ui-error"><p role="alert"><AlertCircle aria-hidden="true" />{children}</p><Button variant="outline" onClick={retry}>Tentar novamente</Button></section>;
}
export function LoadingSkeleton({ label = 'Carregando…' }: { label?: string }) {
  return <div role="status" aria-label={label} className="ui-skeleton"><span>{label}</span><i aria-hidden="true" /><i aria-hidden="true" /></div>;
}
