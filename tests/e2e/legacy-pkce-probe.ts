import { AuthClient } from '@supabase/supabase-js';

// Test-only inverse-order probe with isolated synthetic storage. Return facts,
// never the auth code, verifier, session contents or public app configuration.
export async function reproduceLegacyBootstrap() {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const storageKey = `sb-${new URL(url).hostname.split('.')[0]}-legacy-probe`;
  const verifierKey = `${storageKey}-code-verifier`;
  localStorage.setItem(storageKey, JSON.stringify({ invalidTestSession: true }));
  localStorage.setItem(verifierKey, JSON.stringify('synthetic-browser-verifier/recovery'));
  const verifierBefore = localStorage.getItem(verifierKey) !== null;
  let tokenRequests = 0;
  const auth = new AuthClient({
    url: new URL('auth/v1', url).href,
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
    flowType: 'pkce', detectSessionInUrl: false, persistSession: true,
    autoRefreshToken: true, storage: localStorage, storageKey,
    skipAutoInitialize: false,
    fetch: async () => { tokenRequests++; throw new Error('Unexpected test network request'); },
  });
  await auth.initialize();
  const verifierAfterInitialize = localStorage.getItem(verifierKey) !== null;
  const { error } = await auth.exchangeCodeForSession('synthetic-unused-code');
  return { verifierBefore, verifierAfterInitialize, errorCode: error?.code ?? null, tokenRequests };
}
