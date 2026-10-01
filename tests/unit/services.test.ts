import { describe, expect, it, vi } from 'vitest';
import type { AuthClientV2 } from '../../src/auth-v2/client';
import { SessionStore } from '../../src/auth-v2/session';
import { createServices } from '../../src/app/services';
import { publicConfig } from '../../src/config/env';
import { deferred, owner, publicEnv, session } from '../helpers';

function setup(fetcher?: typeof fetch) {
  const signOut = vi.fn(async () => ({ error: null }));
  const store = new SessionStore({ signOut } as unknown as AuthClientV2['auth']);
  store.accept(session);
  return { store, signOut, ...createServices(publicConfig(publicEnv), store, fetcher) };
}

describe('authenticated application data', () => {
  it('clears private query data when logout changes the owner', async () => {
    const app = setup();
    app.queryClient.setQueryData(['private', 'me', owner], { private: true });
    await app.store.signOut();
    expect(app.queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('rejects a /me response belonging to another identity', async () => {
    const app = setup(vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      identity: { authUserId: '22222222-2222-4222-8222-222222222222' }, profile: null,
    }))));
    await expect(app.api.getMe()).rejects.toMatchObject({ status: 502 });
  });

  it('a late 401 for an old token does not sign out a newer session', async () => {
    const response = deferred<Response>();
    const app = setup(vi.fn<typeof fetch>().mockReturnValue(response.promise));
    const request = app.api.getMe();
    app.store.accept({ ...session, access_token: 'new-test-access' });
    response.resolve(new Response('{}', { status: 401 }));
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(app.signOut).not.toHaveBeenCalled();
    expect(app.store.getSnapshot().session?.access_token).toBe('new-test-access');
  });
});
