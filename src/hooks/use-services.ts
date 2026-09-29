import { useContext, useSyncExternalStore } from 'react';
import { ServicesContext } from '../app/context';
export function useServices() { const services = useContext(ServicesContext); if (!services) throw new Error('App provider missing'); return services; }
export function useAuth() { const { auth } = useServices(); return useSyncExternalStore(auth.subscribe, auth.getSnapshot, auth.getSnapshot); }
