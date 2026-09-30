import { traceVerifierRemoval } from './callback-diagnostics';

const messages = {
  PKCE_STORAGE_UNAVAILABLE: 'O armazenamento local deste navegador está indisponível. Permita seu uso para recuperar a senha.',
  PKCE_VERIFIER_MISSING: 'Abra o link no mesmo navegador e contexto em que solicitou a recuperação.',
  PKCE_VERIFIER_NOT_PERSISTED: 'Não foi possível manter a recuperação no armazenamento deste navegador.',
  PKCE_VERIFIER_REMOVED_DURING_BOOTSTRAP: 'A sessão anterior interrompeu a recuperação durante a inicialização.',
  PKCE_FLOW_ID_INVALID: 'O identificador deste fluxo de recuperação é inválido.',
  PKCE_VERIFIER_MISMATCH: 'Este link não corresponde à solicitação de recuperação deste navegador.',
  PKCE_CODE_EXPIRED: 'Este link expirou ou já foi utilizado.',
  PKCE_EXCHANGE_FAILED: 'Não foi possível validar o link de recuperação.',
  PKCE_CALLBACK_INVALID: 'Este link de recuperação não é válido.',
  PKCE_RECOVERY_PENDING: 'Conclua a recuperação pendente antes de sair da conta.',
  PKCE_REQUEST_IN_PROGRESS: 'A solicitação de recuperação ainda está em andamento.',
} as const;
export class PkceFailure extends Error {
  constructor(readonly code: keyof typeof messages) { super(messages[code]); }
}
export function sanitizePkceFailure(error: unknown): PkceFailure {
  if (error instanceof PkceFailure) return error;
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'pkce_code_verifier_not_found') return new PkceFailure('PKCE_VERIFIER_MISSING');
  if (code === 'bad_code_verifier') return new PkceFailure('PKCE_VERIFIER_MISMATCH');
  if (code === 'flow_state_not_found' || code === 'flow_state_expired') return new PkceFailure('PKCE_CODE_EXPIRED');
  return new PkceFailure('PKCE_EXCHANGE_FAILED');
}
// Preserve the SDK's existing project namespace; do not strand stored verifiers.
export const authStorageKey = (supabaseUrl: string) => `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
export type PkcePhase = 'bootstrap' | 'idle' | 'request' | 'awaiting_callback' | 'exchange' | 'logout';

export function persistentPkceStorage(storageKey: string, phase: () => PkcePhase) {
  let local: Storage;
  try {
    local = window.localStorage;
    const probe = `${storageKey}-probe-${crypto.randomUUID()}`;
    local.setItem(probe, '1');
    const readable = local.getItem(probe) === '1';
    local.removeItem(probe);
    if (!readable) throw new PkceFailure('PKCE_STORAGE_UNAVAILABLE');
  } catch { throw new PkceFailure('PKCE_STORAGE_UNAVAILABLE'); }
  const isVerifierKey = (key: string) => key === `${storageKey}-code-verifier` || (key.startsWith(`${storageKey}-flow-`) && key.endsWith('-code-verifier'));
  const storage = {
    getItem(key: string) { try { return local.getItem(key); } catch { throw new PkceFailure('PKCE_STORAGE_UNAVAILABLE'); } },
    setItem(key: string, value: string) { try { local.setItem(key, value); } catch { throw new PkceFailure('PKCE_STORAGE_UNAVAILABLE'); } },
    removeItem(key: string) {
      try {
        const wasPresent = isVerifierKey(key) && local.getItem(key) !== null;
        local.removeItem(key);
        if (wasPresent) traceVerifierRemoval(storageKey, phase());
      } catch { throw new PkceFailure('PKCE_STORAGE_UNAVAILABLE'); }
    },
  };
  function verifier(flowId?: string): { present: boolean; recovery: boolean } {
    if (flowId !== undefined && !/^[a-zA-Z0-9_-]{8,64}$/.test(flowId)) throw new PkceFailure('PKCE_FLOW_ID_INVALID');
    const raw = storage.getItem(flowId === undefined ? `${storageKey}-code-verifier` : `${storageKey}-flow-${flowId}-code-verifier`);
    let value: unknown;
    try { value = raw === null ? null : JSON.parse(raw); } catch { value = null; }
    return { present: typeof value === 'string' && !!value.split('/')[0], recovery: typeof value === 'string' && value.endsWith('/recovery') };
  }
  return { storage, verifier };
}
