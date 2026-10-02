import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from '../../src/api/client';
import { input, profile, owner } from '../helpers';
describe('backend contract boundary', () => {
  it('adds current Bearer token and validates /me', async () => {
    let token = 'first-test-token'; const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ identity: { authUserId: owner }, profile: null })));
    const api = createApiClient('https://api.example.test', () => token, vi.fn(), fetcher);
    token = 'current-test-token'; const me = await api.getMe(); expect(me.profile).toBeNull();
    expect(fetcher.mock.calls[0]?.[1]?.headers).toMatchObject({ authorization: 'Bearer current-test-token' });
    expect(fetcher.mock.calls[0]?.[1]?.redirect).toBe('error');
  });
  it('sends only contract profile fields and reads response', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(profile)));
    const api = createApiClient('https://api.example.test', () => 'test-token', vi.fn(), fetcher);
    expect(await api.updateProfile(input)).toEqual(profile);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1]?.body as string)).toEqual(input);
  });
  it('handles 401, network errors, malformed contracts and cancellation safely', async () => {
    const logout = vi.fn(async () => {}); const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', { status: 401 }));
    const api = createApiClient('https://api.example.test', () => 'test-token', logout, fetcher);
    await expect(api.getMe()).rejects.toMatchObject({ status: 401 }); expect(logout).toHaveBeenCalledWith('test-token');
    fetcher.mockRejectedValueOnce(new Error('private provider message')); await expect(api.getMe()).rejects.toMatchObject({ status: 0 });
    fetcher.mockResolvedValueOnce(new Response('{"unexpected":true}')); await expect(api.getMe()).rejects.toMatchObject({ status: 502 });
    const canceled = new AbortController(); canceled.abort(); fetcher.mockRejectedValueOnce(new Error('aborted')); await expect(api.getMe(canceled.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
