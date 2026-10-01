import type { Session } from '@supabase/supabase-js';
export const owner = '11111111-1111-4111-8111-111111111111';
export const publicEnv = { VITE_SUPABASE_URL: 'https://identity.example.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture_only', VITE_API_BASE_URL: 'http://localhost:3001' };
export const session: Session = { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user: { id: owner, aud: 'authenticated', created_at: '2026-01-01T00:00:00Z', email: 'test@example.test', app_metadata: {}, user_metadata: {} } };
export const input = { displayName: 'Pessoa Teste', locale: 'pt-BR', timezone: 'America/Sao_Paulo' };
export const profile = { ...input, id: '33333333-3333-4333-8333-333333333333', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' };
export function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done; }); return { promise, resolve }; }
