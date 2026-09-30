import type { AuthChangeEvent } from '@supabase/supabase-js';
import type { AuthCallback } from './callback';
import type { PkcePhase } from './pkce-storage';

interface CallbackDiagnostic {
  autoInitializeSkipped?: boolean;
  callbackStarted?: boolean;
  callbackFinished?: boolean;
  exchangeStarted?: boolean;
  exchangeSucceeded?: boolean;
  exchangeErrorName?: string;
  exchangeErrorCode?: string;
  exchangeErrorMessage?: string;
  verifierPresentBeforeExchange?: boolean;
  verifierPresentAfterExchange?: boolean;
  sessionPresentAfterExchange?: boolean;
  authEvent?: AuthChangeEvent;
  sessionPresent: boolean;
  codeVerifierPresent?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

// Temporary diagnostics for the human MDL 1F gate; compiled out of production.
// Only fixed paths, events and booleans are allowed, never provider error text.
export function traceCallback(callback: AuthCallback | null, diagnostic: CallbackDiagnostic) {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'development' || !callback || window.location.hostname !== 'localhost') return;
  // eslint-disable-next-line no-console -- Requested localhost-only, credential-free callback diagnostics.
  console.info('[auth-callback]', {
    pathname: callback.kind === 'recovery' ? '/auth/recovery' : '/auth/confirm',
    origin: window.location.origin,
    codePresent: callback.hasCode,
    ...diagnostic,
  });
}
export function traceRecoveryRequest(storageKey: string, codeVerifierPresentBefore: boolean, codeVerifierPresentAfter: boolean) {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'development' || window.location.hostname !== 'localhost') return;
  // eslint-disable-next-line no-console -- Temporary local diagnostics; no credential values.
  console.info('[auth-pkce-request]', { origin: window.location.origin, storageKey, codeVerifierPresentBefore, codeVerifierPresentAfter });
}
export function traceRecoverySubmission(details: { emailPresent: boolean; emailLength: number; emailNormalized: boolean; requestStarted: boolean; requestReturnedError?: boolean; redirectTo: string }) {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'development' || window.location.hostname !== 'localhost') return;
  // eslint-disable-next-line no-console -- Only metadata from the current form submission; never the address or provider response.
  console.info('[auth-recovery-request]', details);
}
export function traceVerifierRemoval(storageKey: string, phase: PkcePhase) {
  if (!import.meta.env.DEV || import.meta.env.MODE !== 'development' || window.location.hostname !== 'localhost') return;
  // eslint-disable-next-line no-console -- Identify SDK cleanup phase without logging the key suffix or value.
  console.info('[auth-pkce-removal]', { origin: window.location.origin, storageKey, source: 'sdk', phase, codeVerifierRemoved: true });
}
