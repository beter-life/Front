import type { z } from 'zod';
import { meSchema, profileSchema, profileInputSchema } from '../profile/schema';
import type { ProfileInput } from '../profile/schema';
export class ApiError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
export function createApiClient(baseUrl: string, getToken: () => string | undefined, unauthorized: (token: string) => Promise<void>, fetcher: typeof fetch = fetch) {
  async function request<T>(path: string, schema: z.ZodType<T>, method: 'GET' | 'PUT' | 'POST' | 'PATCH', body?: unknown, signal?: AbortSignal): Promise<T> {
    const token = getToken();
    if (!token) throw new ApiError(401, 'Entre novamente para continuar.');
    let response: Response;
    try {
      response = await fetcher(baseUrl + path, { method, credentials: 'omit', redirect: 'error', cache: 'no-store',
        headers: { authorization: 'Bearer ' + token, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15000)]),
      });
    } catch {
      if (signal?.aborted) throw new DOMException('Request canceled', 'AbortError');
      throw new ApiError(0, 'Não foi possível conectar. Confira sua conexão e tente novamente.');
    }
    if (response.status === 401) { await unauthorized(token); throw new ApiError(401, 'Sua sessão expirou. Entre novamente.'); }
    if (!response.ok) throw new ApiError(response.status, response.status === 400 ? 'Confira os campos, a moeda e as categorias selecionadas.' : response.status === 404 ? 'Este registro não está disponível para sua conta.' : response.status === 409 ? 'O registro está inativo ou a operação conflita com uma solicitação anterior.' : response.status === 429 ? 'Muitas tentativas. Aguarde um momento.' : 'Não foi possível concluir a solicitação. Tente novamente.');
    try { return schema.parse(await response.json()); } catch { throw new ApiError(502, 'A resposta do serviço não pôde ser validada. Tente novamente.'); }
  }
  return { request, getMe: (signal?: AbortSignal) => request('/api/v1/me', meSchema, 'GET', undefined, signal), updateProfile: (input: ProfileInput) => request('/api/v1/me/profile', profileSchema, 'PUT', profileInputSchema.parse(input)) };
}
export type ApiClient = ReturnType<typeof createApiClient>;
