import { createContext } from 'react';
import type { AuthClientV2 } from './client';
import type { SessionStore } from './session';

export interface AuthContextValue { client: AuthClientV2; store: SessionStore }
export const AuthContext = createContext<AuthContextValue | null>(null);
