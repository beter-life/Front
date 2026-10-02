import { describe, expect, it, vi } from 'vitest';
import type { AuthClientV2 } from '../../src/auth-v2/client';
import { verifySignup } from '../../src/auth-v2/confirmation';
import { signIn, LoginFailure } from '../../src/auth-v2/login';
import { requestRecovery, setRecoveredPassword, verifyRecovery } from '../../src/auth-v2/recovery';
import { SessionStore } from '../../src/auth-v2/session';
import { requestSignup } from '../../src/auth-v2/signup';
import { session } from '../helpers';

function client() {
  const auth = {
    signInWithPassword: vi.fn(), signUp: vi.fn(), signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(), verifyOtp: vi.fn(), updateUser: vi.fn(),
    onAuthStateChange: vi.fn(), getSession: vi.fn(),
  };
  return { auth, client: { auth } as unknown as AuthClientV2 };
}

describe('clean-room Auth operations', () => {
  it('normalizes login once, obtains a session, and keeps credentials out of errors', async () => {
    const fake = client();
    fake.auth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
    await expect(signIn(fake.client, { email: '  TeSt@Example.Test  ', password: 'safe-password' })).resolves.toEqual(session);
    expect(fake.auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'test@example.test', password: 'safe-password' });
    fake.auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null });
    await expect(signIn(fake.client, { email: 'test@example.test', password: 'safe-password' })).rejects.toBeInstanceOf(LoginFailure);
  });

  it('does not distinguish an unknown account from a wrong password', async () => {
    const fake = client();
    fake.auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { code: 'invalid_credentials', message: 'provider detail' } });
    const first = signIn(fake.client, { email: 'test@example.test', password: 'wrong-password' });
    const second = signIn(fake.client, { email: 'missing@example.test', password: 'wrong-password' });
    await expect(first).rejects.toThrow('E-mail ou senha incorretos.');
    await expect(second).rejects.toThrow('E-mail ou senha incorretos.');
  });

  it('registers one Auth listener despite repeated bootstrap and signs out safely', async () => {
    const fake = client();
    let emit!: (event: string, value: typeof session | null) => void;
    fake.auth.onAuthStateChange.mockImplementation((listener) => { emit = listener; return { data: { subscription: { unsubscribe: vi.fn() } } }; });
    fake.auth.signOut.mockResolvedValue({ error: null });
    const store = new SessionStore(fake.client.auth);
    const change = vi.fn(); store.subscribe(change);
    store.start(); store.start();
    expect(fake.auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    expect(fake.auth.getSession).not.toHaveBeenCalled();
    emit('SIGNED_IN', session);
    emit('INITIAL_SESSION', null); // A late bootstrap result cannot replace the newer session.
    expect(store.getSnapshot()).toMatchObject({ status: 'authenticated', user: session.user });
    await store.signOut();
    expect(fake.auth.signOut).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toMatchObject({ status: 'unauthenticated', session: null });
    expect(change).toHaveBeenCalled();
  });

  it('uses an origin-bound signup redirect and a non-enumerating request contract', async () => {
    const fake = client();
    fake.auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: 'user_already_exists' } });
    await requestSignup(fake.client, { email: '  TeSt@Example.Test  ', password: 'safe-password', confirmPassword: 'safe-password' }, 'http://localhost:3101');
    expect(fake.auth.signUp).toHaveBeenCalledExactlyOnceWith({ email: 'test@example.test', password: 'safe-password', options: { emailRedirectTo: 'http://localhost:3101/auth/confirm' } });
  });

  it('verifies only signup token hashes with the documented email type', async () => {
    const fake = client();
    fake.auth.verifyOtp.mockResolvedValue({ data: { user: session.user, session }, error: null });
    await expect(verifySignup(fake.client, 'synthetic-hash', 'email')).resolves.toMatchObject({ status: 'confirmed', session });
    expect(fake.auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'synthetic-hash', type: 'email' });
    await expect(verifySignup(fake.client, 'synthetic-hash', 'recovery')).resolves.toEqual({ status: 'invalid' });
    fake.auth.verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { code: 'otp_expired' } });
    await expect(verifySignup(fake.client, 'used-hash', 'email')).resolves.toEqual({ status: 'invalid' });
  });

  it('requests one neutral recovery and verifies only recovery token hashes', async () => {
    const fake = client();
    fake.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    await requestRecovery(fake.client, { email: '  TeSt@Example.Test  ' }, 'http://localhost:3101');
    expect(fake.auth.resetPasswordForEmail).toHaveBeenCalledExactlyOnceWith('test@example.test', { redirectTo: 'http://localhost:3101/auth/recovery' });
    fake.auth.verifyOtp.mockResolvedValue({ data: { session }, error: null });
    await expect(verifyRecovery(fake.client, 'synthetic-hash', 'recovery')).resolves.toEqual(session);
    expect(fake.auth.verifyOtp).toHaveBeenCalledExactlyOnceWith({ token_hash: 'synthetic-hash', type: 'recovery' });
    await expect(verifyRecovery(fake.client, 'synthetic-hash', 'email')).resolves.toBeNull();
    fake.auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { code: 'otp_expired' } });
    await expect(verifyRecovery(fake.client, 'used-hash', 'recovery')).resolves.toBeNull();
  });

  it('updates a password only after a verified recovery session', async () => {
    const fake = client();
    await expect(setRecoveredPassword(fake.client, null, { password: 'new-password', confirmPassword: 'new-password' })).rejects.toThrow();
    expect(fake.auth.updateUser).not.toHaveBeenCalled();
    fake.auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'same_password', message: 'provider detail' } });
    await expect(setRecoveredPassword(fake.client, session, { password: 'new-password', confirmPassword: 'new-password' })).rejects.toThrow('Não foi possível atualizar a senha.');
    fake.auth.updateUser.mockResolvedValue({ data: { user: session.user }, error: null });
    await expect(setRecoveredPassword(fake.client, session, { password: 'new-password', confirmPassword: 'new-password' })).resolves.toBeUndefined();
    expect(fake.auth.updateUser).toHaveBeenLastCalledWith({ password: 'new-password' });
  });
});
