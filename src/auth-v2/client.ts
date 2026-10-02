import { createClient } from '@supabase/supabase-js';
import type { PublicConfig } from '../config/env';

export type AuthClientV2 = ReturnType<typeof createClient>;

let singleton: AuthClientV2 | undefined;
let configuration: { url: string; key: string } | undefined;

export function getAuthClient(config: PublicConfig): AuthClientV2 {
  if (singleton) {
    if (configuration?.url !== config.supabaseUrl || configuration.key !== config.publishableKey) {
      throw new Error('A configuração pública de Auth mudou durante a execução.');
    }
    return singleton;
  }
  singleton = createClient(config.supabaseUrl, config.publishableKey);
  configuration = { url: config.supabaseUrl, key: config.publishableKey };
  return singleton;
}
