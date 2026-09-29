import { vi } from 'vitest';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';
import type { AuthGateway } from '../src/auth/gateway';
export const owner = '11111111-1111-4111-8111-111111111111';
export const publicEnv = { VITE_SUPABASE_URL: 'https://identity.example.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture_only', VITE_API_BASE_URL: 'http://localhost:3001' };
export const session: Session = { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user: { id: owner, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z', email: 'test@example.test', app_metadata: {}, user_metadata: {} } };
export const input = { displayName: 'Pessoa Teste', locale: 'pt-BR', timezone: 'America/Sao_Paulo' };
export const profile = { ...input, id: '33333333-3333-4333-8333-333333333333', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
export function fakeGateway(initial: Session | null = null) {
  const listeners = new Set<(event: AuthChangeEvent, session: Session | null) => void>();
  const emit = (event: AuthChangeEvent, value: Session | null) => { listeners.forEach((listener) => listener(event, value)); };
  const gateway: AuthGateway = {
    session: vi.fn(async () => initial),
    listen: vi.fn((callback) => { listeners.add(callback); return () => { listeners.delete(callback); }; }),
    login: vi.fn(async () => { emit('SIGNED_IN', session); return session; }),
    signup: vi.fn(async () => null), exchange: vi.fn(async () => ({ session, recovery: false })),
    recover: vi.fn(async () => {}), updatePassword: vi.fn(async () => {}),
    logout: vi.fn(async () => { emit('SIGNED_OUT', null); }),
  };
  return { gateway, emit, listeners };
}
export function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; }
