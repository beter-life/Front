export interface AuthCallback { kind: 'confirmation' | 'recovery'; code?: string; flowId?: string; invalid: boolean }
export function captureCallback(location: Pick<Location, 'href'>, history: Pick<History, 'replaceState' | 'state'>): AuthCallback | null {
  const url = new URL(location.href);
  const kind = url.pathname === '/auth/confirm' ? 'confirmation' : url.pathname === '/auth/recovery' ? 'recovery' : null;
  if (!kind) return null;
  const code = url.searchParams.get('code') ?? undefined;
  const flowId = url.searchParams.get('sb_flow_id') ?? undefined;
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const hasAuthError = ['error', 'error_code', 'error_description'].some((key) => url.searchParams.has(key) || fragment.has(key));
  const invalid = hasAuthError || !code;
  // Consume callback material once, before rendering or making any backend request.
  history.replaceState(history.state, '', url.pathname);
  return { kind, code, flowId, invalid };
}
