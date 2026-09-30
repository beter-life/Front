export interface AuthCallback { kind: 'confirmation' | 'recovery'; hasCode: boolean; invalid: boolean }
export function captureCallback(location: Pick<Location, 'href'>): AuthCallback | null {
  const url = new URL(location.href);
  const kind = url.pathname === '/auth/confirm' ? 'confirmation' : url.pathname === '/auth/recovery' ? 'recovery' : null;
  if (!kind) return null;
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const hasAuthError = ['error', 'error_code', 'error_description'].some((key) => url.searchParams.has(key) || fragment.has(key));
  // Observe only. Supabase must see the original URL (including sb_flow_id) and
  // owns removing the code after its automatic PKCE exchange succeeds.
  return { kind, hasCode: !!url.searchParams.get('code'), invalid: hasAuthError };
}
