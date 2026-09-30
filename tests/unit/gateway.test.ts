import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createAuthGateway } from '../../src/auth/gateway';
import { traceCallback } from '../../src/auth/callback-diagnostics';
import { publicConfig } from '../../src/config/env';
import { deferred, publicEnv, session } from '../helpers';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
const sdk = {
  initialize: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn(),
  exchangeCodeForSession: vi.fn(),
};
const callback = { kind: 'recovery', hasCode: true, invalid: false } as const;
function emit(event: AuthChangeEvent, value: Session | null) {
  const listener = sdk.onAuthStateChange.mock.calls[0]![0] as (event: AuthChangeEvent, value: Session | null) => void;
  listener(event, value);
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(createClient).mockReturnValue({ auth: sdk } as unknown as ReturnType<typeof createClient>);
  sdk.initialize.mockResolvedValue({ error: null });
  sdk.getSession.mockResolvedValue({ data: { session }, error: null });
  window.history.replaceState(null, '', '/auth/recovery?code=mock-code&sb_flow_id=mock-flow-id');
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); window.history.replaceState(null, '', '/'); });

describe('SDK-owned callback bootstrap', () => {
  it('enables automatic PKCE and waits once, without removing the code or manually exchanging', async () => {
    const pending = deferred<{ error: null }>(); sdk.initialize.mockReturnValue(pending.promise);
    const gateway = createAuthGateway(publicConfig(publicEnv), window.location.origin, callback);
    expect(createClient).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true, debug: false },
    }));
    const first = gateway.callbackSession(); expect(gateway.callbackSession()).toBe(first);
    expect(sdk.initialize).toHaveBeenCalledTimes(1);
    expect(sdk.onAuthStateChange.mock.invocationCallOrder[0]!).toBeLessThan(sdk.initialize.mock.invocationCallOrder[0]!);
    expect(new URL(window.location.href).searchParams.has('code')).toBe(true);
    // Simulate the SDK completing its own exchange and cleaning the URL.
    window.history.replaceState(null, '', '/auth/recovery');
    emit('PASSWORD_RECOVERY', session); emit('INITIAL_SESSION', session); pending.resolve({ error: null });
    await expect(first).resolves.toEqual({ session, recovery: true });
    expect(sdk.getSession).toHaveBeenCalledTimes(1);
    expect(sdk.exchangeCodeForSession).not.toHaveBeenCalled();
  });
  it('replays recovery emitted before React subscribes, even after INITIAL_SESSION', async () => {
    const gateway = createAuthGateway(publicConfig(publicEnv), window.location.origin, callback);
    emit('PASSWORD_RECOVERY', session); emit('INITIAL_SESSION', session);
    const listener = vi.fn(); const unsubscribe = gateway.listen(listener);
    expect(listener).toHaveBeenLastCalledWith('PASSWORD_RECOVERY', session);
    unsubscribe(); emit('TOKEN_REFRESHED', session); expect(listener).toHaveBeenCalledTimes(1);
  });
  it('waits for the initial notification before reading the settled session', async () => {
    const gateway = createAuthGateway(publicConfig(publicEnv), window.location.origin, callback);
    const completed = gateway.callbackSession(); await Promise.resolve();
    expect(sdk.getSession).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/auth/recovery');
    emit('PASSWORD_RECOVERY', session); emit('INITIAL_SESSION', session);
    await expect(completed).resolves.toMatchObject({ recovery: true });
  });
  it('rejects an unprocessed code instead of trusting an unrelated existing login', async () => {
    const gateway = createAuthGateway(publicConfig(publicEnv), window.location.origin, callback);
    emit('INITIAL_SESSION', session);
    await expect(gateway.callbackSession()).rejects.toThrow('Não foi possível concluir');
    expect(new URL(window.location.href).searchParams.has('code')).toBe(true);
    expect(sdk.exchangeCodeForSession).not.toHaveBeenCalled();
  });
  it('propagates initialization failure only after completion without provider details', async () => {
    sdk.initialize.mockResolvedValue({ error: { code: 'pkce_code_verifier_not_found', message: 'private-provider-detail' } });
    const gateway = createAuthGateway(publicConfig(publicEnv), window.location.origin, callback);
    emit('INITIAL_SESSION', null);
    await expect(gateway.callbackSession()).rejects.toThrow('Não foi possível concluir');
    expect(sdk.exchangeCodeForSession).not.toHaveBeenCalled();
  });
  it('logs only fixed, sanitized local fields and remains silent in production', () => {
    const log = vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.stubEnv('DEV', true); vi.stubEnv('MODE', 'development');
    traceCallback(callback, { callbackStarted: true, callbackCompleted: false, sessionPresent: false });
    expect(log).toHaveBeenCalledExactlyOnceWith('[auth-callback]', {
      pathname: '/auth/recovery', hasCode: true, callbackStarted: true, callbackCompleted: false, sessionPresent: false,
    });
    vi.stubEnv('DEV', false); traceCallback(callback, { sessionPresent: true });
    expect(log).toHaveBeenCalledTimes(1);
  });
});
