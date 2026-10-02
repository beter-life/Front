import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { AuthClientV2 } from './client';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';
export interface SessionSnapshot {
  status: SessionStatus;
  session: Session | null;
  user: User | null;
}

const initial: SessionSnapshot = { status: 'loading', session: null, user: null };

export class SessionStore {
  private snapshot: SessionSnapshot = initial;
  private readonly listeners = new Set<() => void>();
  private started = false;

  constructor(private readonly auth: AuthClientV2['auth']) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // An initial storage result must not replace a newer sign-in or sign-out.
      if (event === 'INITIAL_SESSION' && this.snapshot.status !== 'loading') return;
      this.accept(session);
    });
  }

  accept(session: Session | null): void {
    this.snapshot = {
      status: session ? 'authenticated' : 'unauthenticated',
      session,
      user: session?.user ?? null,
    };
    for (const listener of this.listeners) listener();
  }

  getSnapshot = (): SessionSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  async signOut(): Promise<void> {
    const { error } = await this.auth.signOut();
    if (error) throw new Error('Não foi possível sair. Tente novamente.');
    this.accept(null);
  }
}
