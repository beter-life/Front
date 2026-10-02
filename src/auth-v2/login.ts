import type { Session } from '@supabase/supabase-js';
import type { AuthClientV2 } from './client';
import { loginSchema } from './validation';

export class LoginFailure extends Error {}

export async function signIn(client: AuthClientV2, input: { email: string; password: string }): Promise<Session> {
  const { email, password } = loginSchema.parse(input);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === 'invalid_credentials') throw new LoginFailure('E-mail ou senha incorretos.');
    if (error.code === 'email_not_confirmed') throw new LoginFailure('Confirme seu e-mail antes de entrar.');
    throw new LoginFailure('Não foi possível entrar. Tente novamente em instantes.');
  }
  if (!data.session) throw new LoginFailure('Não foi possível iniciar sua sessão. Tente novamente.');
  return data.session;
}
