import type { ReactNode } from 'react';
import { AuthContext } from './context';
import type { AuthContextValue } from './context';

export function AuthProviderV2({ client, store, children }: AuthContextValue & { children: ReactNode }) {
  return <AuthContext value={{ client, store }}>{children}</AuthContext>;
}
