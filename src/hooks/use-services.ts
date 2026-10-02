import { useContext } from 'react';
import { ServicesContext } from '../app/context';
export function useServices() { const services = useContext(ServicesContext); if (!services) throw new Error('App provider missing'); return services; }
