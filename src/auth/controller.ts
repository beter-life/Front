import type { Session } from '@supabase/supabase-js';
import type { AuthGateway } from './gateway';
import type { AuthCallback } from './callback';

const recoverySessionKey = 'beter-life:auth:recovery-user';

function recoveryStorage(): Storage | null {
  try { return typeof window === 'undefined' ? null : window.sessionStorage; } catch { return null; }
}
function rememberRecoverySession(session: Session) {
  try { recoveryStorage()?.setItem(recoverySessionKey, session.user.id); } catch { /* Recovery still works in memory when storage is unavailable. */ }
}
function isRecoverySession(session: Session | null) {
  try { return !!session && recoveryStorage()?.getItem(recoverySessionKey) === session.user.id; } catch { return false; }
}
function clearRecoverySession() {
  try { recoveryStorage()?.removeItem(recoverySessionKey); } catch { /* Storage is optional. */ }
}

export interface AuthSnapshot {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  session: Session | null;
  recovery: boolean;
  callback: 'none' | 'pending' | 'success' | 'error';
}
export class AuthController {
  private state: AuthSnapshot = { status: 'loading', session: null, recovery: false, callback: 'none' };
  private listeners = new Set<() => void>();
  private revision = 0;
  private initialized = false;
  private boot?: Promise<void>;
  private unsubscribe?: () => void;
  private consumers = 0;
  constructor(readonly gateway: AuthGateway, private clearPrivate: () => void, private callback: AuthCallback | null = null) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<AuthSnapshot>) { this.state = { ...this.state, ...patch }; this.listeners.forEach((listener) => listener()); }
  private accept(session: Session | null, recovery = false) {
    recovery = !!session && recovery;
    if (session && recovery) rememberRecoverySession(session);
    if (this.state.session?.user.id !== session?.user.id || recovery) this.clearPrivate();
    this.publish({ session, recovery, status: this.initialized ? (session ? 'authenticated' : 'unauthenticated') : 'loading' });
  }
  private async restoreRecoverySession(): Promise<boolean> {
    const eventSession = this.state.recovery ? this.state.session : null;
    if (eventSession) {
      this.accept(eventSession, true);
      this.publish({ callback: 'success' });
      return true;
    }

    const revision = this.revision;
    let session: Session | null;
    try { session = await this.gateway.session(); } catch {
      const recovered = this.state.recovery ? this.state.session : null;
      if (!recovered) return false;
      this.accept(recovered, true);
      this.publish({ callback: 'success' });
      return true;
    }

    // A newer auth event wins over this asynchronous session snapshot.
    const newerRecoverySession = this.state.recovery ? this.state.session : null;
    if (newerRecoverySession) session = newerRecoverySession;
    else if (revision !== this.revision) return false;
    if (!session || !isRecoverySession(session)) return false;

    this.accept(session, true);
    this.publish({ callback: 'success' });
    return true;
  }
  start() {
    this.consumers++;
    if (!this.unsubscribe) this.unsubscribe = this.gateway.listen((event, session) => {
      this.revision++;
      if (event === 'PASSWORD_RECOVERY' && session) rememberRecoverySession(session);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') clearRecoverySession();
      const sameRecoveryUser = event !== 'SIGNED_IN' && !!session && this.state.recovery && this.state.session?.user.id === session.user.id;
      this.accept(session, event === 'PASSWORD_RECOVERY' || sameRecoveryUser || isRecoverySession(session));
      if (event === 'PASSWORD_RECOVERY' && this.callback?.kind === 'recovery') this.publish({ callback: 'success' });
    });
    this.boot ??= this.initialize();
    return () => { if (--this.consumers === 0) { this.unsubscribe?.(); this.unsubscribe = undefined; } };
  }
  ready = () => this.boot ?? Promise.resolve();
  private async initialize() {
    const revision = this.revision;
    try {
      if (this.callback) {
        this.publish({ callback: 'pending' });
        try {
          // Wait for the single manual exchange AND the initial auth notification.
          // Missing code/session/marker cannot invalidate an in-flight callback.
          const result = await this.gateway.callbackSession();
          const session = revision === this.revision ? result.session : this.state.session;
          const eventRecovery = !!session && this.state.recovery && this.state.session?.user.id === session.user.id;
          const recovery = !!session && ((result.recovery && result.session?.user.id === session.user.id) || eventRecovery || isRecoverySession(session));
          if (this.callback.kind === 'recovery') {
            if (!session || !recovery) throw new Error('Recovery session required');
          } else if (this.callback.invalid || !this.callback.hasCode || !session) {
            throw new Error('Invalid confirmation');
          }
          this.accept(session, recovery);
          this.publish({ callback: 'success' });
        } catch (error) {
          // A consumed link must not discard recovery already established by Auth.
          if (this.callback.kind !== 'recovery' || !await this.restoreRecoverySession()) throw error;
        }
      } else {
        const session = await this.gateway.session();
        if (revision === this.revision) this.accept(session, isRecoverySession(session));
      }
      this.initialized = true;
      this.publish({ status: this.state.session ? 'authenticated' : 'unauthenticated' });
    } catch {
      this.initialized = true;
      const recoverySession = this.callback?.kind === 'recovery' && this.state.recovery ? this.state.session : null;
      if (recoverySession) {
        this.accept(recoverySession, true);
        this.publish({ status: 'authenticated', callback: 'success' });
        return;
      }
      this.publish({ status: this.callback ? 'unauthenticated' : 'error', session: null, recovery: false, callback: this.callback ? 'error' : 'none' });
      this.clearPrivate();
    }
  }
  async login(email: string, password: string) { const session = await this.gateway.login(email, password); this.revision++; clearRecoverySession(); this.accept(session); }
  async signup(email: string, password: string) { const session = await this.gateway.signup(email, password); if (session) { this.revision++; clearRecoverySession(); this.accept(session); } return !!session; }
  async logout() { await this.gateway.logout(); this.revision++; clearRecoverySession(); this.accept(null); this.clearPrivate(); }
  async expire(token: string) {
    if (this.state.session?.access_token !== token) return;
    this.revision++; clearRecoverySession(); this.accept(null); this.clearPrivate();
    await this.gateway.logout().catch(() => undefined);
  }
  async completeRecovery(password: string) {
    if (!this.state.recovery || !this.state.session) throw new Error('Recovery session required');
    await this.gateway.updatePassword(password);
    await this.logout();
  }
}
