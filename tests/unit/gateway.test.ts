import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createAuthGateway, getAuthGateway } from '../../src/auth/gateway';
import { traceCallback } from '../../src/auth/callback-diagnostics';
import { authStorageKey } from '../../src/auth/pkce-storage';
import { publicConfig } from '../../src/config/env';
import { deferred, publicEnv, session } from '../helpers';

vi.mock('@supabase/supabase-js', () => ({ AuthClient: vi.fn() }));
const sdk = {
  initialize: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(),
  exchangeCodeForSession: vi.fn(), resetPasswordForEmail: vi.fn(), signOut: vi.fn(),
};
const config = publicConfig(publicEnv);
const storageKey = authStorageKey(config.supabaseUrl);
const verifierKey = storageKey + '-code-verifier';
const callback = { kind: 'recovery', hasCode: true, code: 'mock-code', invalid: false } as const;
function emit(event: AuthChangeEvent, value: Session | null) {
  const listener = sdk.onAuthStateChange.mock.calls[0]![0] as (event: AuthChangeEvent, value: Session | null) => void;
  listener(event, value);
}
function seedVerifier(key = verifierKey) { localStorage.setItem(key, JSON.stringify('test-only-verifier/recovery')); }
function adapter() { return vi.mocked(AuthClient).mock.calls[0]![0]!.storage!; }
beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear();
  vi.mocked(AuthClient).mockImplementation(function () { return sdk as unknown as InstanceType<typeof AuthClient>; });
  sdk.initialize.mockResolvedValue({ error: null });
  sdk.getSession.mockResolvedValue({ data: { session }, error: null });
  sdk.onAuthStateChange.mockImplementation((listener) => {
    queueMicrotask(() => listener('INITIAL_SESSION', session));
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  sdk.exchangeCodeForSession.mockImplementation(async () => {
    await adapter().removeItem(verifierKey);
    return { data: { session }, error: null };
  });
  sdk.resetPasswordForEmail.mockImplementation(async () => {
    await adapter().setItem(verifierKey, JSON.stringify('test-only-verifier/recovery'));
    return { error: null };
  });
  sdk.signOut.mockResolvedValue({ error: null });
  window.history.replaceState(null, '', '/auth/recovery?code=mock-code');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); window.history.replaceState(null, '', '/'); });

describe('single manual PKCE callback', () => {
  it('uses persistent storage and exchanges once, retaining the URL until the session settles', async () => {
    seedVerifier();
    const pending = deferred<{ data: { session: Session }; error: null }>();
    sdk.exchangeCodeForSession.mockReturnValue(pending.promise);
    const gateway = createAuthGateway(config, window.location.origin, callback);
    expect(AuthClient).toHaveBeenCalledWith(expect.objectContaining({
      flowType: 'pkce', detectSessionInUrl: false, persistSession: true, autoRefreshToken: true,
      skipAutoInitialize: true, debug: false, storageKey, storage: expect.any(Object),
    }));
    expect(await adapter().getItem(verifierKey)).toBe(localStorage.getItem(verifierKey));
    expect(sessionStorage.getItem(verifierKey)).toBeNull();
    const first = gateway.callbackSession(); expect(gateway.callbackSession()).toBe(first);
    expect(sdk.getSession).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(sdk.exchangeCodeForSession).toHaveBeenCalledTimes(1));
    expect(sdk.exchangeCodeForSession).toHaveBeenCalledWith('mock-code', undefined);
    expect(sdk.initialize).not.toHaveBeenCalled();
    expect(sdk.onAuthStateChange).not.toHaveBeenCalled();
    expect(new URL(window.location.href).searchParams.has('code')).toBe(true);
    await expect(gateway.logout()).rejects.toMatchObject({ code: 'PKCE_RECOVERY_PENDING' });
    expect(sdk.signOut).not.toHaveBeenCalled();
    pending.resolve({ data: { session }, error: null });
    // No PASSWORD_RECOVERY event: the valid manual callback session is sufficient.
    await expect(first).resolves.toEqual({ session, recovery: true });
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
    expect(sdk.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(sdk.getSession).toHaveBeenCalledTimes(1);
    expect(new URL(window.location.href).searchParams.has('code')).toBe(false);
    await gateway.callbackSession(); expect(sdk.exchangeCodeForSession).toHaveBeenCalledTimes(1);
  });
  it('replays recovery emitted after exchange but before React subscribes', async () => {
    const gateway = createAuthGateway(config, window.location.origin, callback);
    seedVerifier(); await gateway.callbackSession();
    emit('PASSWORD_RECOVERY', session); emit('INITIAL_SESSION', session);
    const listener = vi.fn(); const unsubscribe = gateway.listen(listener);
    expect(listener).toHaveBeenLastCalledWith('PASSWORD_RECOVERY', session);
    unsubscribe(); emit('TOKEN_REFRESHED', session); expect(listener).toHaveBeenCalledTimes(1);
  });
  it('runs exchange before initializing or reading an invalid prior session', async () => {
    seedVerifier(); localStorage.setItem(storageKey, JSON.stringify({ invalidTestSession: true }));
    sdk.initialize.mockImplementation(async () => {
      expect(sdk.exchangeCodeForSession).toHaveBeenCalledTimes(1);
      return { error: null };
    });
    const gateway = createAuthGateway(config, window.location.origin, callback);
    await expect(gateway.callbackSession()).resolves.toMatchObject({ recovery: true });
    expect(sdk.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
    expect(sdk.getSession).toHaveBeenCalledTimes(1);
  });
  it('diagnoses absent verifier without trusting an unrelated session or removing the code', async () => {
    const gateway = createAuthGateway(config, window.location.origin, callback);
    await expect(gateway.callbackSession()).rejects.toMatchObject({ code: 'PKCE_VERIFIER_MISSING' });
    expect(new URL(window.location.href).searchParams.has('code')).toBe(true);
    expect(sdk.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(sdk.initialize).not.toHaveBeenCalled();
  });
  it('does not initialize the SDK while exchange is pending', async () => {
    seedVerifier(); vi.stubEnv('DEV', true); vi.stubEnv('MODE', 'development');
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    const pending = deferred<{ data: { session: Session }; error: null }>();
    sdk.exchangeCodeForSession.mockReturnValue(pending.promise);
    const gateway = createAuthGateway(config, window.location.origin, callback);
    const completed = gateway.callbackSession();
    await vi.waitFor(() => expect(sdk.exchangeCodeForSession).toHaveBeenCalledTimes(1));
    expect(sdk.initialize).not.toHaveBeenCalled();
    expect(sdk.onAuthStateChange).not.toHaveBeenCalled();
    pending.resolve({ data: { session }, error: null });
    await completed;
    expect(JSON.stringify(log.mock.calls)).not.toContain('test-only-verifier');
  });
  it('keeps an exchange error bounded, sanitized and single-use', async () => {
    seedVerifier(); vi.stubEnv('DEV', true); vi.stubEnv('MODE', 'development');
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    sdk.exchangeCodeForSession.mockImplementation(async () => {
      await adapter().removeItem(verifierKey);
      return { data: { session: null }, error: { code: 'bad_code_verifier', message: 'private-provider-detail' } };
    });
    const gateway = createAuthGateway(config, window.location.origin, callback);
    await expect(gateway.callbackSession()).rejects.toMatchObject({ code: 'PKCE_VERIFIER_MISMATCH' });
    await expect(gateway.callbackSession()).rejects.toMatchObject({ code: 'PKCE_VERIFIER_MISMATCH' });
    expect(sdk.exchangeCodeForSession).toHaveBeenCalledTimes(1);
    expect(new URL(window.location.href).searchParams.has('code')).toBe(true);
    expect(log).toHaveBeenLastCalledWith('[auth-callback]', expect.objectContaining({ callbackFinished: true, codeVerifierPresent: false, errorCode: 'PKCE_VERIFIER_MISMATCH' }));
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/private-provider-detail|test-only-verifier|mock-code/);
  });
  it('reads an explicit flow slot without falling back to another request verifier', async () => {
    seedVerifier();
    const flowId = 'mock-flow-id'; seedVerifier(storageKey + '-flow-' + flowId + '-code-verifier');
    const gateway = createAuthGateway(config, window.location.origin, { ...callback, flowId });
    await expect(gateway.callbackSession()).resolves.toMatchObject({ recovery: true });
    expect(sdk.exchangeCodeForSession).toHaveBeenCalledWith('mock-code', { flowId });
  });
  it('fails closed if the settled session is absent after exchange', async () => {
    seedVerifier(); sdk.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const gateway = createAuthGateway(config, window.location.origin, callback);
    await expect(gateway.callbackSession()).rejects.toMatchObject({ code: 'PKCE_EXCHANGE_FAILED' });
    expect(new URL(window.location.href).searchParams.has('code')).toBe(false);
  });
});

describe('persistent request state', () => {
  it('finishes bootstrap before request and prevents logout from removing the pending verifier', async () => {
    const pending = deferred<{ error: null }>(); sdk.initialize.mockReturnValue(pending.promise);
    const gateway = createAuthGateway(config, window.location.origin);
    const request = gateway.recover('test@example.test'); await Promise.resolve();
    expect(sdk.resetPasswordForEmail).not.toHaveBeenCalled();
    await expect(gateway.logout()).rejects.toMatchObject({ code: 'PKCE_RECOVERY_PENDING' });
    await expect(gateway.recover('test@example.test')).rejects.toMatchObject({ code: 'PKCE_REQUEST_IN_PROGRESS' });
    pending.resolve({ error: null }); await request;
    expect(sdk.resetPasswordForEmail).toHaveBeenCalledWith('test@example.test', { redirectTo: window.location.origin + '/auth/recovery' });
    expect(localStorage.getItem(verifierKey)).not.toBeNull();
    await expect(gateway.logout()).rejects.toMatchObject({ code: 'PKCE_RECOVERY_PENDING' });
    expect(sdk.signOut).not.toHaveBeenCalled();
    expect(localStorage.getItem(verifierKey)).not.toBeNull();
  });
  it('does not report success if the SDK fails to persist a verifier', async () => {
    sdk.resetPasswordForEmail.mockResolvedValue({ error: null });
    const gateway = createAuthGateway(config, window.location.origin);
    await expect(gateway.recover('test@example.test')).rejects.toMatchObject({ code: 'PKCE_VERIFIER_NOT_PERSISTED' });
  });
  it('normalizes the current recovery address at the network boundary and logs metadata only', async () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('DEV', true); vi.stubEnv('MODE', 'development');
    const gateway = createAuthGateway(config, window.location.origin);
    await gateway.recover('  TeSt@Example.Test  ');
    expect(sdk.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith('test@example.test', { redirectTo: window.location.origin + '/auth/recovery' });
    expect(log).toHaveBeenCalledWith('[auth-recovery-request]', {
      emailPresent: true, emailLength: 17, emailNormalized: true, requestStarted: true,
      redirectTo: window.location.origin + '/auth/recovery',
    });
    expect(log).toHaveBeenCalledWith('[auth-recovery-request]', {
      emailPresent: true, emailLength: 17, emailNormalized: true, requestStarted: true, requestReturnedError: false,
      redirectTo: window.location.origin + '/auth/recovery',
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain('test@example.test');
  });
  it('keeps the existing namespace and one client across consumers', () => {
    const first = getAuthGateway(config, window.location.origin);
    expect(getAuthGateway(config, window.location.origin)).toBe(first);
    expect(AuthClient).toHaveBeenCalledTimes(1);
    expect(storageKey).toBe('sb-identity-auth-token');
  });
  it('rejects unavailable persistent storage without silently using memory', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(() => createAuthGateway(config, window.location.origin)).toThrow('O armazenamento local');
    expect(AuthClient).not.toHaveBeenCalled();
  });
  it('logs only fixed local fields and remains silent in production', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('DEV', true); vi.stubEnv('MODE', 'development');
    traceCallback(callback, { callbackStarted: true, callbackFinished: false, sessionPresent: false });
    expect(log).toHaveBeenCalledExactlyOnceWith('[auth-callback]', {
      pathname: '/auth/recovery', origin: window.location.origin, codePresent: true, callbackStarted: true, callbackFinished: false, sessionPresent: false,
    });
    vi.stubEnv('DEV', false); traceCallback(callback, { sessionPresent: true });
    expect(log).toHaveBeenCalledTimes(1);
  });
});
