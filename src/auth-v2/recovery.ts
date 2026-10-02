import type { Session } from '@supabase/supabase-js';
import type { AuthClientV2 } from './client';
import { newPasswordSchema, recoveryRequestSchema } from './validation';

export async function requestRecovery(client: AuthClientV2, input: { email: string }, origin: string): Promise<void> {
  const { email } = recoveryRequestSchema.parse(input);
  // A successful SDK response does not prove that an email was delivered.
  await client.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/recovery` });
}

export async function verifyRecovery(client: AuthClientV2, tokenHash: string | null, type: string | null): Promise<Session | null> {
  if (!tokenHash || type !== 'recovery') return null;
  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
  return error ? null : data.session;
}

export async function setRecoveredPassword(client: AuthClientV2, session: Session | null, input: { password: string; confirmPassword: string }): Promise<void> {
  if (!session) throw new Error('O link de recuperação não está disponível.');
  const { password } = newPasswordSchema.parse(input);
  const { error } = await client.auth.updateUser({ password });
  if (error) throw new Error('Não foi possível atualizar a senha. Tente novamente.');
}
