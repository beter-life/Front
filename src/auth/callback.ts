export interface AuthCallback { kind: 'confirmation' | 'recovery'; hasCode: boolean; code?: string; flowId?: string; invalid: boolean }
export function captureCallback(location: Pick<Location, 'href'>): AuthCallback | null {
  const url = new URL(location.href);
  const kind = url.pathname === '/auth/confirm' ? 'confirmation' : url.pathname === '/auth/recovery' ? 'recovery' : null;
  if (!kind) return null;
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ''));
  const hasAuthError = ['error', 'error_code', 'error_description'].some((key) => url.searchParams.has(key) || fragment.has(key));
  // Retain callback material only in memory. Never remove it before exchange.
  const code = url.searchParams.get('code') || undefined;
  const flowId = url.searchParams.get('sb_flow_id') ?? undefined;
  return { kind, hasCode: !!code, ...(code ? { code } : {}), ...(flowId !== undefined ? { flowId } : {}), invalid: hasAuthError };
}
