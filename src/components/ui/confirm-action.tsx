import { useRef, useState } from 'react';
import { Button } from './button';
import { Dialog } from './dialog';

export function ConfirmAction({ label, title, impact, confirmLabel = 'Confirmar ação', pending, onConfirm }: {
  label: string; title: string; impact: string; confirmLabel?: string; pending: boolean; onConfirm: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false), locked = useRef(false);
  return <><Button variant="outline" disabled={pending} onClick={() => { setFailed(false); setOpen(true); }}>{label}</Button>{open && <Dialog title={title} role="alertdialog" onClose={() => setOpen(false)} pending={pending}>
    <p>{impact}</p><div className="ui-form-feedback">{failed && <p role="alert">Não foi possível concluir. Tente novamente.</p>}</div>
    <Button disabled={pending} onClick={async () => {
      if (locked.current) return; locked.current = true; setFailed(false);
      try { await onConfirm(); setOpen(false); } catch { setFailed(true); } finally { locked.current = false; }
    }}>{pending ? 'Aguarde…' : confirmLabel}</Button><Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Voltar sem alterar</Button>
  </Dialog>}</>;
}
