import { useState } from 'react';
import { useSearchParams } from 'react-router';

/** Presentation-only flag; never submits a financial request. */
export function useCreationShortcut() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  return [open || params.get('action') === 'create', (next: boolean) => {
    setOpen(next);
    if (!next && params.get('action') === 'create') {
      const clean = new URLSearchParams(params); clean.delete('action');
      setParams(clean, { replace: true });
    }
  }] as const;
}
