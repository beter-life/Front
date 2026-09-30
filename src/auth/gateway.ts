import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { PublicConfig } from '../config/env';
import type { AuthCallback } from './callback';
import { traceCallback } from './callback-diagnostics';

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
  traceCallback(callback, { callbackStarted: true, callbackCompleted: false, sessionPresent: false });
  const client = createClient(config.supabaseUrl, config.publishableKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, debug: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(20000)]) }) },
  });
  const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();
  let latest: { event: AuthChangeEvent; session: Session | null } | undefined;
  let recoveryUser: string | null = null;
  let initialSessionReceived!: () => void;
  const initialSessionReady = new Promise<void>((resolve) => { initialSessionReceived = resolve; });
  // One SDK bridge for this singleton client's lifetime. Register synchronously,
  // before React effects: URL initialization can finish before the first render.
  client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') recoveryUser = session?.user.id ?? null;
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') recoveryUser = null;
    latest = { event, session };
    traceCallback(callback, { authEvent: event, sessionPresent: !!session });
    for (const listener of listeners) listener(event, session);
    if (event === 'INITIAL_SESSION') initialSessionReceived();
  });
  let completion: Promise<CallbackSession> | undefined;
  async function finishCallback(): Promise<CallbackSession> {
    // initialize() is idempotent in auth-js. It waits for the SDK-owned exchange;
    // no public exchangeCodeForSession call competes with URL detection.
    const { error: initializationError } = await client.auth.initialize();
    await initialSessionReady;
    const { data, error: sessionError } = await client.auth.getSession();
    const unprocessedCode = !!callback?.hasCode && new URL(window.location.href).searchParams.has('code');
    const result = initializationError ? 'sdk_error' : sessionError ? 'session_error' : unprocessedCode ? 'unprocessed_code' : 'ready';
    traceCallback(callback, { callbackStarted: true, callbackCompleted: true, sessionPresent: !!data.session, result });
    // auth-js can finish initialization without exchanging a code when the
    // originating browser's PKCE verifier is absent. Never trust an old login.
    if (initializationError || sessionError || unprocessedCode) failure(initializationError ?? sessionError);
    return { session: data.session, recovery: !!data.session && recoveryUser === data.session.user.id };
  }
  return {
    async session() { const { data, error } = await client.auth.getSession(); if (error) failure(error); return data.session; },
    listen(listener) {
      listeners.add(listener);
      // Replay an early recovery event even if INITIAL_SESSION followed it.
      if (latest) listener(latest.session && recoveryUser === latest.session.user.id ? 'PASSWORD_RECOVERY' : latest.event, latest.session);
      return () => { listeners.delete(listener); };
    },
    async login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) failure(error); return data.session; },
    async signup(email, password) { const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: origin + '/auth/confirm' } }); if (error) failure(error); return data.session; },
    callbackSession() { return completion ??= finishCallback(); },
    async recover(email) { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/recovery' }); if (error) failure(error); },
    async updatePassword(password) { const { error } = await client.auth.updateUser({ password }); if (error) failure(error); },
    async logout() { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) failure(error); },
  };
}
