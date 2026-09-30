import type { AuthChangeEvent } from '@supabase/supabase-js';
import type { AuthCallback } from './callback';

interface CallbackDiagnostic {
  callbackStarted?: boolean;
  callbackCompleted?: boolean;
  authEvent?: AuthChangeEvent;
  sessionPresent: boolean;
  result?: 'ready' | 'sdk_error' | 'unprocessed_code' | 'session_error';
}

// Temporary diagnostics for the human MDL 1F gate; compiled out of production.
// Only fixed paths, events and booleans are allowed, never provider error text.
export function traceCallback(callback: AuthCallback | null, diagnostic: CallbackDiagnostic) {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'development' || !callback || window.location.hostname !== 'localhost') return;
  // eslint-disable-next-line no-console -- Requested localhost-only, credential-free callback diagnostics.
  console.info('[auth-callback]', {
    pathname: callback.kind === 'recovery' ? '/auth/recovery' : '/auth/confirm',
    hasCode: callback.hasCode,
    ...diagnostic,
  });
}
