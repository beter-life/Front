export interface AuthCallback { kind: 'confirmation' | 'recovery'; code?: string; flowId?: string; invalid: boolean }
export function captureCallback(location: Pick<Location, 'href'>, history: Pick<History, 'replaceState' | 'state'>): AuthCallback | null {
  const url = new URL(location.href);
  const kind = url.pathname === '/auth/confirm' ? 'confirmation' : url.pathname === '/auth/recovery' ? 'recovery' : null;
  if (!kind) return null;
  const code = url.searchParams.get('code') ?? undefined;
  const flowId = url.searchParams.get('sb_flow_id') ?? undefined;
  const invalid = !!url.searchParams.get('error') || !!url.hash || !code;
  // Consume callback material once, before rendering or making any backend request.
  history.replaceState(history.state, '', url.pathname);
  return { kind, code, flowId, invalid };
}
