import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ServicesContext } from './context';
import type { Services } from './services';
export function AppProviders({ services, children }: { services: Services; children: ReactNode }) {
  return <QueryClientProvider client={services.queryClient}><ServicesContext value={services}>{children}</ServicesContext></QueryClientProvider>;
}
