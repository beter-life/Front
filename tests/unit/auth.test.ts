import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { AuthController } from '../../src/auth/controller';
import { captureCallback } from '../../src/auth/callback';
import { deferred, fakeGateway, session } from '../helpers';
beforeEach(() => sessionStorage.clear());
describe('session lifecycle', () => {
  it('loads, listens and cleans up; StrictMode initializes only once', async () => {
    const fake = fakeGateway(session); const auth = new AuthController(fake.gateway, vi.fn());
    const stop = auth.start(); stop(); const stopAgain = auth.start();
    await auth.ready(); expect(auth.getSnapshot().status).toBe('authenticated');
    expect(fake.gateway.session).toHaveBeenCalledTimes(1); expect(fake.listeners.size).toBe(1);
    stopAgain(); expect(fake.listeners.size).toBe(0);
  });
  it('does not let a stale initial session overwrite a sign-out event', async () => {
    const fake = fakeGateway(); const pending = deferred<Session | null>(); fake.gateway.session = vi.fn(() => pending.promise);
    const clear = vi.fn(); const auth = new AuthController(fake.gateway, clear); const stop = auth.start();
    fake.emit('SIGNED_OUT', null); pending.resolve(session); await auth.ready();
    expect(auth.getSnapshot().session).toBeNull(); expect(auth.getSnapshot().status).toBe('unauthenticated'); stop();
  });
  it('keeps a PASSWORD_RECOVERY event that races session bootstrap', async () => {
    const fake = fakeGateway(); const pending = deferred<Session | null>(); fake.gateway.session = vi.fn(() => pending.promise);
    const auth = new AuthController(fake.gateway, vi.fn()); const stop = auth.start();
    fake.emit('PASSWORD_RECOVERY', session); pending.resolve(null); await auth.ready();
    expect(auth.getSnapshot()).toMatchObject({ status: 'authenticated', recovery: true, session }); stop();
  });
  it('clears private cache on logout and ignores stale 401 for a refreshed token', async () => {
    const fake = fakeGateway(session); const clear = vi.fn(); const auth = new AuthController(fake.gateway, clear); const stop = auth.start(); await auth.ready();
    fake.emit('TOKEN_REFRESHED', { ...session, access_token: 'refreshed-test-access' });
    await auth.expire(session.access_token); expect(auth.getSnapshot().status).toBe('authenticated');
    await auth.logout(); expect(auth.getSnapshot().session).toBeNull(); expect(clear).toHaveBeenCalled(); stop();
  });
  it('distinguishes valid recovery from normal login and invalid callbacks', async () => {
    const fake = fakeGateway(); fake.gateway.exchange = vi.fn(async () => ({ session, recovery: true }));
    const auth = new AuthController(fake.gateway, vi.fn(), { kind: 'recovery', code: 'test-code', invalid: false }); const stop = auth.start(); await auth.ready();
    expect(auth.getSnapshot().recovery).toBe(true); await auth.completeRecovery('new-test-password'); expect(fake.gateway.updatePassword).toHaveBeenCalledWith('new-test-password'); expect(auth.getSnapshot().session).toBeNull(); stop();
    const other = new AuthController(fakeGateway(session).gateway, vi.fn()); const off = other.start(); await other.ready(); await expect(other.completeRecovery('ignored')).rejects.toThrow(); off();
  });
  it('preserves PASSWORD_RECOVERY emitted while the callback exchange is pending', async () => {
    const fake = fakeGateway(); const pending = deferred<{ session: Session; recovery: boolean }>();
    fake.gateway.exchange = vi.fn(() => pending.promise);
    const auth = new AuthController(fake.gateway, vi.fn(), { kind: 'recovery', code: 'one-time-code', invalid: false }); const stop = auth.start();
    fake.emit('PASSWORD_RECOVERY', session); pending.resolve({ session, recovery: false }); await auth.ready();
    expect(auth.getSnapshot()).toMatchObject({ status: 'authenticated', recovery: true, callback: 'success' });
    expect(fake.gateway.exchange).toHaveBeenCalledTimes(1); stop();
  });
  it('restores an established recovery session when a consumed callback cannot be exchanged', async () => {
    const fake = fakeGateway(session); fake.gateway.exchange = vi.fn().mockRejectedValue(new Error('one-time token already consumed'));
    const auth = new AuthController(fake.gateway, vi.fn(), { kind: 'recovery', code: 'consumed-code', invalid: false }); const stop = auth.start();
    fake.emit('PASSWORD_RECOVERY', session); await auth.ready();
    expect(auth.getSnapshot()).toMatchObject({ status: 'authenticated', recovery: true, callback: 'success', session });
    expect(fake.gateway.exchange).toHaveBeenCalledTimes(1); stop();
  });
  it('restores a same-tab recovery session after reload without callback material', async () => {
    const first = fakeGateway(); const original = new AuthController(first.gateway, vi.fn()); const stopOriginal = original.start(); await original.ready();
    first.emit('PASSWORD_RECOVERY', session); stopOriginal();
    const reloaded = fakeGateway(session); const auth = new AuthController(reloaded.gateway, vi.fn(), { kind: 'recovery', invalid: true }); const stop = auth.start(); await auth.ready();
    expect(auth.getSnapshot()).toMatchObject({ status: 'authenticated', recovery: true, callback: 'success', session }); stop();
    expect(reloaded.gateway.exchange).not.toHaveBeenCalled();
  });
  it('rejects a consumed callback when no recovery event or session exists', async () => {
    const fake = fakeGateway(null); fake.gateway.exchange = vi.fn().mockRejectedValue(new Error('one-time token already consumed'));
    const auth = new AuthController(fake.gateway, vi.fn(), { kind: 'recovery', code: 'consumed-code', invalid: false }); const stop = auth.start(); await auth.ready();
    expect(auth.getSnapshot()).toMatchObject({ status: 'unauthenticated', recovery: false, callback: 'error', session: null });
    expect(fake.gateway.exchange).toHaveBeenCalledTimes(1); stop();
  });
  it('keeps the recovery session available when updateUser fails', async () => {
    const fake = fakeGateway(); fake.gateway.exchange = vi.fn(async () => ({ session, recovery: true }));
    fake.gateway.updatePassword = vi.fn().mockRejectedValue(new Error('update rejected'));
    const auth = new AuthController(fake.gateway, vi.fn(), { kind: 'recovery', code: 'test-code', invalid: false }); const stop = auth.start(); await auth.ready();
    await expect(auth.completeRecovery('new-test-password')).rejects.toThrow('update rejected');
    expect(auth.getSnapshot()).toMatchObject({ status: 'authenticated', recovery: true, session }); expect(fake.gateway.logout).not.toHaveBeenCalled(); stop();
  });
  it('rejects invalid and wrong-purpose recovery links', async () => {
    for (const invalid of [true, false]) {
      const fake = fakeGateway(); const auth = new AuthController(fake.gateway, vi.fn(), { kind: 'recovery', code: 'test-code', invalid }); const stop = auth.start(); await auth.ready();
      expect(auth.getSnapshot().callback).toBe('error'); expect(auth.getSnapshot().recovery).toBe(false); stop();
    }
  });
  it('turns initialization failures into bounded error state', async () => {
    const fake = fakeGateway(); fake.gateway.session = vi.fn().mockRejectedValue(new Error('offline'));
    const auth = new AuthController(fake.gateway, vi.fn()); const stop = auth.start(); await auth.ready(); expect(auth.getSnapshot().status).toBe('error'); stop();
  });
  it('consumes callback query and preserves PKCE flow ID only in memory', () => {
    const history = { state: null, replaceState: vi.fn() };
    const result = captureCallback({ href: 'https://front.example.test/auth/recovery?code=opaque-test-code&sb_flow_id=test-flow' }, history);
    expect(result).toEqual({ kind: 'recovery', code: 'opaque-test-code', flowId: 'test-flow', invalid: false });
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '/auth/recovery');
    expect(captureCallback({ href: 'https://front.example.test/auth/confirm?error=expired' }, history)?.invalid).toBe(true);
    const fragmentFailure = captureCallback({ href: 'https://front.example.test/auth/recovery#error=access_denied&error_description=private-detail' }, history);
    expect(fragmentFailure).toMatchObject({ kind: 'recovery', invalid: true });
    expect(history.replaceState).toHaveBeenLastCalledWith(null, '', '/auth/recovery');
  });
});
