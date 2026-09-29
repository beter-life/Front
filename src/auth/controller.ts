import type { Session } from '@supabase/supabase-js';
import type { AuthGateway } from './gateway';
import type { AuthCallback } from './callback';

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
    if (this.state.session?.user.id !== session?.user.id || recovery) this.clearPrivate();
    this.publish({ session, recovery, status: this.initialized ? (session ? 'authenticated' : 'unauthenticated') : 'loading' });
  }
  start() {
    this.consumers++;
    if (!this.unsubscribe) this.unsubscribe = this.gateway.listen((event, session) => {
      this.revision++;
      this.accept(session, event === 'PASSWORD_RECOVERY' || (!!session && this.state.recovery));
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
        if (this.callback.invalid || !this.callback.code) throw new Error('Invalid callback');
        const result = await this.gateway.exchange(this.callback.code, this.callback.flowId);
        if (this.callback.kind === 'recovery' && !result.recovery) throw new Error('Wrong callback purpose');
        this.accept(result.session, result.recovery);
        this.publish({ callback: 'success' });
      } else {
        const session = await this.gateway.session();
        if (revision === this.revision) this.accept(session);
      }
      this.initialized = true;
      this.publish({ status: this.state.session ? 'authenticated' : 'unauthenticated' });
    } catch {
      this.initialized = true;
      this.publish({ status: this.callback ? 'unauthenticated' : 'error', session: null, recovery: false, callback: this.callback ? 'error' : 'none' });
      this.clearPrivate();
    }
  }
  async login(email: string, password: string) { const session = await this.gateway.login(email, password); this.revision++; this.accept(session); }
  async signup(email: string, password: string) { const session = await this.gateway.signup(email, password); if (session) { this.revision++; this.accept(session); } return !!session; }
  async logout() { await this.gateway.logout(); this.revision++; this.accept(null); this.clearPrivate(); }
  async expire(token: string) {
    if (this.state.session?.access_token !== token) return;
    this.revision++; this.accept(null); this.clearPrivate();
    await this.gateway.logout().catch(() => undefined);
  }
  async completeRecovery(password: string) {
    if (!this.state.recovery || !this.state.session) throw new Error('Recovery session required');
    await this.gateway.updatePassword(password);
    await this.logout();
  }
}
