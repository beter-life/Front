import type { AuthClientV2 } from './client';
import { signupSchema } from './validation';

export async function requestSignup(client: AuthClientV2, input: { email: string; password: string; confirmPassword: string }, origin: string): Promise<void> {
  const { email, password } = signupSchema.parse(input);
  // Provider responses for existing users are intentionally not surfaced.
  await client.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/confirm` } });
}
