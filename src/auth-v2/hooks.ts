import { useContext, useSyncExternalStore } from 'react';
import { AuthContext } from './context';

export function useAuthV2() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProviderV2 está ausente.');
  const snapshot = useSyncExternalStore(context.store.subscribe, context.store.getSnapshot, context.store.getSnapshot);
  return { ...snapshot, client: context.client, store: context.store };
}
