import { describe, expect, it } from 'vitest';
import { loginSchema, signupSchema, passwordSchema } from '../../src/auth/schema';
import { profileInputSchema } from '../../src/profile/schema';
import { publicConfig } from '../../src/config/env';
import { publicEnv, input } from '../helpers';
describe('public boundaries', () => {
  it('validates login email and required password', () => {
    expect(loginSchema.safeParse({ email: 'wrong', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@example.test', password: 'valid-password' }).success).toBe(true);
  });
  it('requires long matching passwords for signup and reset', () => {
    expect(signupSchema.safeParse({ email: 'a@example.test', password: 'short', confirmPassword: 'short' }).success).toBe(false);
    expect(passwordSchema.safeParse({ password: 'long-password', confirmPassword: 'different' }).success).toBe(false);
    expect(signupSchema.safeParse({ email: 'a@example.test', password: 'long-password', confirmPassword: 'long-password' }).success).toBe(true);
  });
  it('validates profile and rejects client ownership', () => {
    expect(profileInputSchema.parse(input)).toEqual(input);
    expect(profileInputSchema.safeParse({ ...input, authUserId: 'forbidden' }).success).toBe(false);
    expect(profileInputSchema.safeParse({ ...input, displayName: ' ', timezone: 'Not/AZone' }).success).toBe(false);
  });
  it('allows only public key and safe origins', () => {
    expect(publicConfig(publicEnv).apiBaseUrl).toBe('http://localhost:3001');
    for (const patch of [{ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_do_not_use' }, { VITE_SMTP_PASSWORD: 'forbidden' }, { VITE_API_BASE_URL: 'http://external.example.test' }, { VITE_API_BASE_URL: 'https://user:password@example.test' }]) expect(() => publicConfig({ ...publicEnv, ...patch })).toThrow();
  });
});
