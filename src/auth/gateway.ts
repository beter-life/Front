import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { PublicConfig } from '../config/env';

export interface AuthGateway {
  session(): Promise<Session | null>;
  listen(callback: (event: AuthChangeEvent, session: Session | null) => void): () => void;
  login(email: string, password: string): Promise<Session>;
  signup(email: string, password: string): Promise<Session | null>;
  exchange(code: string, flowId?: string): Promise<{ session: Session; recovery: boolean }>;
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
export function createAuthGateway(config: PublicConfig, origin: string): AuthGateway {
  const client = createClient(config.supabaseUrl, config.publishableKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true, debug: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.any([...(init?.signal ? [init.signal] : []), AbortSignal.timeout(20000)]) }) },
  });
  return {
    async session() { const { data, error } = await client.auth.getSession(); if (error) failure(error); return data.session; },
    listen(callback) { const { data } = client.auth.onAuthStateChange(callback); return () => data.subscription.unsubscribe(); },
    async login(email, password) { const { data, error } = await client.auth.signInWithPassword({ email, password }); if (error || !data.session) failure(error); return data.session; },
    async signup(email, password) { const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: origin + '/auth/confirm' } }); if (error) failure(error); return data.session; },
    async exchange(code, flowId) { const { data, error } = await client.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined); if (error || !data.session) failure(error); return { session: data.session, recovery: 'redirectType' in data && data.redirectType === 'recovery' }; },
    async recover(email) { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: origin + '/auth/recovery' }); if (error) failure(error); },
    async updatePassword(password) { const { error } = await client.auth.updateUser({ password }); if (error) failure(error); },
    async logout() { const { error } = await client.auth.signOut({ scope: 'local' }); if (error) failure(error); },
  };
}
