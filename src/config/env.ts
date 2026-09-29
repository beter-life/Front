export interface PublicConfig { supabaseUrl: string; publishableKey: string; apiBaseUrl: string }
export class PublicConfigError extends Error {
  constructor() { super('Configuração pública indisponível. Confira as variáveis VITE_ descritas no README.'); }
}
const safeUrl = (value: unknown, localAllowed: boolean) => {
  if (typeof value !== 'string') throw new PublicConfigError();
  const url = new URL(value);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(localAllowed && local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new PublicConfigError();
  return url.origin;
};
export function publicConfig(env: Record<string, unknown>): PublicConfig {
  try {
    if (Object.keys(env).some((name) => /^VITE_.*(SECRET|SERVICE_ROLE|PASSWORD|DATABASE|SMTP|PRIVATE)/i.test(name))) throw new PublicConfigError();
    const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (typeof key !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)) throw new PublicConfigError();
    return { supabaseUrl: safeUrl(env.VITE_SUPABASE_URL, false), publishableKey: key, apiBaseUrl: safeUrl(env.VITE_API_BASE_URL, true) };
  } catch { throw new PublicConfigError(); }
}
