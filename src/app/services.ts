import { QueryClient } from '@tanstack/react-query';
import { getAuthGateway } from '../auth/gateway';
import type { AuthGateway } from '../auth/gateway';
import { AuthController } from '../auth/controller';
import type { AuthCallback } from '../auth/callback';
import { createApiClient } from '../api/client';
import type { PublicConfig } from '../config/env';
export function createServices(config: PublicConfig, origin: string, callback: AuthCallback | null = null, gateway?: AuthGateway, fetcher?: typeof fetch) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30000, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  const auth = new AuthController(gateway ?? getAuthGateway(config, origin, callback), () => queryClient.clear(), callback);
  const api = createApiClient(config.apiBaseUrl, () => auth.getSnapshot().session?.access_token, (token) => auth.expire(token), fetcher);
  return { queryClient, auth, api };
}
export type Services = ReturnType<typeof createServices>;
