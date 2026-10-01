import { QueryClient } from '@tanstack/react-query';
import type { SessionStore } from '../auth-v2/session';
import { ApiError, createApiClient } from '../api/client';
import type { PublicConfig } from '../config/env';
export function createServices(config: PublicConfig, store: SessionStore, fetcher?: typeof fetch) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 30000, refetchOnWindowFocus: false }, mutations: { retry: false } } });
  let owner = store.getSnapshot().user?.id;
  store.subscribe(() => {
    const current = store.getSnapshot().user?.id;
    if (current !== owner) { owner = current; queryClient.clear(); }
  });
  const transport = createApiClient(config.apiBaseUrl, () => store.getSnapshot().session?.access_token, async (token) => {
    if (store.getSnapshot().session?.access_token === token) await store.signOut();
  }, fetcher);
  const api = {
    async getMe(signal?: AbortSignal) {
      const expectedOwner = store.getSnapshot().user?.id;
      const me = await transport.getMe(signal);
      if (!expectedOwner || me.identity.authUserId !== expectedOwner) throw new ApiError(502, 'A resposta do serviço não pôde ser validada. Tente novamente.');
      return me;
    },
    updateProfile: transport.updateProfile,
  };
  return { queryClient, api };
}
export type Services = ReturnType<typeof createServices>;
