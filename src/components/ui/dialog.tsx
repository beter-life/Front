import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';

export function Dialog({ title, children, onClose, pending = false, drawer = false, role = 'dialog' }: {
  title: string; children: ReactNode; onClose: () => void; pending?: boolean; drawer?: boolean;
  role?: 'dialog' | 'alertdialog';
}) {
  const ref = useRef<HTMLDialogElement>(null), id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
    dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    return () => {
      dialog.close(); document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);
  return createPortal(<dialog ref={ref} role={role} aria-modal="true" aria-labelledby={id}
    className={'ui-dialog' + (drawer ? ' ui-drawer' : '')}
    onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget || pending) return;
      const r = event.currentTarget.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose();
    }}>
    <div className="ui-dialog-heading"><h2 id={id}>{title}</h2><Button variant="ghost" aria-label={'Fechar ' + title} disabled={pending} onClick={onClose}><X aria-hidden="true" /></Button></div>
    <div className="ui-dialog-body">{children}</div>
  </dialog>, document.body);
}
