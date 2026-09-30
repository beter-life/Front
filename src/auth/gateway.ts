import { AuthClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { PublicConfig } from '../config/env';
import type { AuthCallback } from './callback';
import { traceCallback, traceRecoveryRequest, traceRecoverySubmission } from './callback-diagnostics';
import { recoveryEmailSchema } from './schema';
import { authStorageKey, persistentPkceStorage, PkceFailure, sanitizePkceFailure } from './pkce-storage';
import type { PkcePhase } from './pkce-storage';

export interface CallbackSession { session: Session | null; recovery: boolean }

export interface AuthGateway {
  session(): Promise<Session | null>;
  listen(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void;
  login(email: string, password: string): Promise<Session>;
  signup(email: string, password: string): Promise<Session | null>;
  callbackSession(): Promise<CallbackSession>;
  recover(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  logout(): Promise<void>;
}
export class AuthFailure extends Error {}
function failure(error: { code?: string } | null): never {
  const messages: Record<string, string> = {
    invalid_credentials: 'E-mail ou senha incorretos.',
    email_not_confirmed: 'Confirme seu e-mail antes de entrar.',
    over_email_send_rate_limit: 'Aguarde alguns minutos antes de solicitar outro e-mail.',
    over_request_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    weak_password: 'Escolha uma senha mais forte, com letras, números e símbolos.',
    same_password: 'Escolha uma senha diferente da anterior.',
  };
  throw new AuthFailure(messages[error?.code ?? ''] ?? 'Não foi possível concluir. Tente novamente em instantes.');
}
export function createAuthGateway(config: PublicConfig, origin: string, callback: AuthCallback | null = null): AuthGateway {
  const storageKey = authStorageKey(config.supabaseUrl);
  let phase: PkcePhase = 'bootstrap';
  let requestInProgress = false;
  let exchangeInProgress = false;
  const { storage, verifier } = persistentPkceStorage(storageKey, () => phase);
  let presentBeforeBootstrap = false;
  try { presentBeforeBootstrap = verifier(callback?.flowId).present; } catch { /* Diagnosed after bootstrap without exposing callback material. */ }
  traceCallback(callback, { autoInitializeSkipped: true, callbackStarted: true, callbackFinished: false, codeVerifierPresent: presentBeforeBootstrap, verifierPresentBeforeExchange: presentBeforeBootstrap, exchangeStarted: false, sessionPresent: false });
  // SupabaseClient registers an internal Auth listener in its constructor. In
  // auth-js 2.117.2 that listener reads storage before manual exchange, even
  // with skipAutoInitialize. Use the officially exported AuthClient directly.
  const client = new AuthClient({
    url: new URL('auth/v1', config.supabaseUrl).href,
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}` },
    flowType: 'pkce', detectSessionInUrl: false, persistSession: true,
    autoRefreshToken: true, storage, storageKey, skipAutoInitialize: true, debug: false,
    fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(20000)]) }),
  });
  const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();
  let latest: { event: AuthChangeEvent; session: Session | null } | undefined;
  let recoveryUser: string | null = null;
  let initialSessionReceived!: () => void;
  const initialSessionReady = new Promise<void>((resolve) => { initialSessionReceived = resolve; });
  let bridgeRegistered = false;
  function registerBridge() {
    if (bridgeRegistered) return;
    bridgeRegistered = true;
    // onAuthStateChange reads the stored session. Register only after the
    // callback exchange, or after normal bootstrap on non-callback routes.
    client.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') recoveryUser = session?.user.id ?? null;
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') recoveryUser = null;
      latest = { event, session };
      traceCallback(callback, { authEvent: event, sessionPresent: !!session });
      for (const listener of listeners) listener(event, session);
      if (event === 'INITIAL_SESSION') initialSessionReceived();
    });
  }
  let bootstrap: Promise<void> | undefined;
  function initializeAfterExchangeOrNormalRoute() {
    return bootstrap ??= (async () => {
      const { error } = await client.initialize();
      if (error) throw sanitizePkceFailure(error);
      registerBridge();
      await initialSessionReady;
      phase = 'idle';
    })();
  }
  let completion: Promise<CallbackSession> | undefined;
  async function finishCallback(): Promise<CallbackSession> {
    let present: boolean;
    let session: Session | null = null;
    try {
      if (callback?.invalid) throw new PkceFailure('PKCE_CALLBACK_INVALID');
      if (callback?.code) {
        present = verifier(callback.flowId).present;
        if (!present) throw new PkceFailure(presentBeforeBootstrap ? 'PKCE_VERIFIER_REMOVED_DURING_BOOTSTRAP' : 'PKCE_VERIFIER_MISSING');
        phase = 'exchange'; exchangeInProgress = true;
        traceCallback(callback, { autoInitializeSkipped: true, callbackStarted: true, callbackFinished: false, codeVerifierPresent: present, verifierPresentBeforeExchange: present, exchangeStarted: true, sessionPresent: false });
        // The only exchange call in the app, protected by the cached completion.
        const { data, error: exchangeError } = await client.exchangeCodeForSession(callback.code, callback.flowId === undefined ? undefined : { flowId: callback.flowId });
        if (exchangeError || !data.session) throw exchangeError ?? new PkceFailure('PKCE_EXCHANGE_FAILED');
        session = data.session;
        traceCallback(callback, { exchangeStarted: true, exchangeSucceeded: true, verifierPresentAfterExchange: verifier(callback.flowId).present, sessionPresentAfterExchange: true, sessionPresent: true });
        // A successful exchange on this callback is recovery context even when
        // the SDK event is delayed or its redirectType is unavailable.
        if (callback.kind === 'recovery') recoveryUser = session.user.id;
        const url = new URL(window.location.href);
        if (url.searchParams.get('code') === callback.code) {
          url.searchParams.delete('code'); url.searchParams.delete('sb_flow_id');
          window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
        }
        await initializeAfterExchangeOrNormalRoute();
        const settled = await client.getSession();
        if (settled.error || !settled.data.session || settled.data.session.user.id !== session.user.id) throw settled.error ?? new PkceFailure('PKCE_EXCHANGE_FAILED');
        session = settled.data.session;
      } else {
        await initializeAfterExchangeOrNormalRoute();
        const { data, error: sessionError } = await client.getSession();
        if (sessionError) throw sessionError;
        session = data.session;
      }
      traceCallback(callback, { callbackFinished: true, codeVerifierPresent: verifier(callback?.flowId).present, sessionPresent: !!session });
      return { session, recovery: !!session && recoveryUser === session.user.id };
    } catch (error) {
      const safe = sanitizePkceFailure(error);
      try { present = verifier(callback?.flowId).present; } catch { present = false; }
      traceCallback(callback, { callbackFinished: true, exchangeSucceeded: false, verifierPresentAfterExchange: present, codeVerifierPresent: present, sessionPresent: !!session, exchangeErrorName: safe.name, exchangeErrorCode: safe.code, exchangeErrorMessage: safe.message, errorCode: safe.code, errorMessage: safe.message });
      throw safe;
    } finally { exchangeInProgress = false; phase = 'idle'; }
  }
  return {
    async session() {
      if (callback?.code) return (await (completion ??= finishCallback())).session;
      await initializeAfterExchangeOrNormalRoute();
      const { data, error } = await client.getSession(); if (error) failure(error); return data.session;
    },
    listen(listener) {
      listeners.add(listener);
      // Replay an early recovery event even if INITIAL_SESSION followed it.
      if (latest) listener(latest.session && recoveryUser === latest.session.user.id ? 'PASSWORD_RECOVERY' : latest.event, latest.session);
      return () => { listeners.delete(listener); };
    },
    async login(email, password) { await initializeAfterExchangeOrNormalRoute(); const { data, error } = await client.signInWithPassword({ email, password }); if (error || !data.session) failure(error); return data.session; },
    async signup(email, password) { await initializeAfterExchangeOrNormalRoute(); const { data, error } = await client.signUp({ email, password, options: { emailRedirectTo: origin + '/auth/confirm' } }); if (error) failure(error); return data.session; },
    callbackSession() { return completion ??= finishCallback(); },
    async recover(email) {
      if (requestInProgress || exchangeInProgress) throw new PkceFailure('PKCE_REQUEST_IN_PROGRESS');
      const normalizedEmail = recoveryEmailSchema.parse({ email }).email;
      const redirectTo = origin + '/auth/recovery';
      const diagnostic = { emailPresent: normalizedEmail.length > 0, emailLength: normalizedEmail.length, emailNormalized: true, requestStarted: true, redirectTo };
      requestInProgress = true;
      try {
        // Finish possible old-session cleanup before creating a new verifier.
        await initializeAfterExchangeOrNormalRoute();
        const before = verifier().present;
        phase = 'request';
        traceRecoverySubmission(diagnostic);
        const { error } = await client.resetPasswordForEmail(normalizedEmail, { redirectTo }).catch((failure: unknown) => {
          traceRecoverySubmission({ ...diagnostic, requestReturnedError: true });
          throw failure;
        });
        traceRecoverySubmission({ ...diagnostic, requestReturnedError: !!error });
        const after = verifier().present;
        traceRecoveryRequest(storageKey, before, after);
        if (error) failure(error);
        if (!after) throw new PkceFailure('PKCE_VERIFIER_NOT_PERSISTED');
      } finally { requestInProgress = false; phase = 'awaiting_callback'; }
    },
    async updatePassword(password) { await initializeAfterExchangeOrNormalRoute(); const { error } = await client.updateUser({ password }); if (error) failure(error); },
    async logout() {
      if (requestInProgress || exchangeInProgress || verifier().recovery || (callback?.flowId && verifier(callback.flowId).recovery)) throw new PkceFailure('PKCE_RECOVERY_PENDING');
      if (callback?.code && !completion) throw new PkceFailure('PKCE_RECOVERY_PENDING');
      phase = 'logout';
      try { await initializeAfterExchangeOrNormalRoute(); const { error } = await client.signOut({ scope: 'local' }); if (error) failure(error); } finally { phase = 'idle'; }
    },
  };
}

let singleton: { config: PublicConfig; origin: string; gateway: AuthGateway } | undefined;
export function getAuthGateway(config: PublicConfig, origin: string, callback: AuthCallback | null = null): AuthGateway {
  if (!singleton) singleton = { config, origin, gateway: createAuthGateway(config, origin, callback) };
  if (singleton.config.supabaseUrl !== config.supabaseUrl || singleton.config.publishableKey !== config.publishableKey || singleton.origin !== origin) throw new Error('Auth client configuration changed');
  return singleton.gateway;
}
