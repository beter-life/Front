import type { Session, User } from '@supabase/supabase-js';
import type { AuthClientV2 } from './client';

export type ConfirmationResult =
  | { status: 'confirmed'; session: Session | null; user: User }
  | { status: 'invalid' };

export async function verifySignup(client: AuthClientV2, tokenHash: string | null, type: string | null): Promise<ConfirmationResult> {
  if (!tokenHash || type !== 'email') return { status: 'invalid' };
  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
  if (error || !data.user) return { status: 'invalid' };
  return { status: 'confirmed', session: data.session, user: data.user };
}
