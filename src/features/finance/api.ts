import { z } from 'zod';
import type { ApiClient } from '../../api/client';
import * as C from './contracts.generated';
export function createFinanceApi(transport: ApiClient) {
  const base = '/api/v1/finance';
  const query = (values: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
    return '?' + params.toString();
  };
  return {
    accounts: (signal?: AbortSignal) =>
      transport.request(base + '/accounts', z.array(C.AccountSchema), 'GET', undefined, signal),
    createAccount: (input: C.AccountInput) =>
      transport.request(
        base + '/accounts',
        C.AccountSchema,
        'POST',
        C.AccountInputSchema.parse(input),
      ),
    patchAccount: (id: string, input: C.AccountPatch) =>
      transport.request(
        base + '/accounts/' + z.uuid().parse(id),
        C.AccountSchema,
        'PATCH',
        C.AccountPatchSchema.parse(input),
      ),
    categories: (signal?: AbortSignal) =>
      transport.request(base + '/categories', z.array(C.CategorySchema), 'GET', undefined, signal),
    createCategory: (input: C.CategoryInput) =>
      transport.request(
        base + '/categories',
        C.CategorySchema,
        'POST',
        C.CategoryInputSchema.parse(input),
      ),
    patchCategory: (id: string, input: C.CategoryPatch) =>
      transport.request(
        base + '/categories/' + z.uuid().parse(id),
        C.CategorySchema,
        'PATCH',
        C.CategoryPatchSchema.parse(input),
      ),
    transactions: (filters: C.TransactionQuery, signal?: AbortSignal) =>
      transport.request(
        base + '/transactions' + query(C.TransactionQuerySchema.parse(filters)),
        C.TransactionPageSchema,
        'GET',
        undefined,
        signal,
      ),
    createTransaction: (input: C.TransactionInput) =>
      transport.request(
        base + '/transactions',
        C.TransactionSchema,
        'POST',
        C.TransactionInputSchema.parse(input),
      ),
    patchTransaction: (id: string, input: C.TransactionPatch) =>
      transport.request(
        base + '/transactions/' + z.uuid().parse(id),
        C.TransactionSchema,
        'PATCH',
        C.TransactionPatchSchema.parse(input),
      ),
    createTransfer: (input: C.TransferInput) =>
      transport.request(
        base + '/transfers',
        C.TransferSchema,
        'POST',
        C.TransferInputSchema.parse(input),
      ),
    patchTransfer: (id: string, input: C.TransferPatch) =>
      transport.request(
        base + '/transfers/' + z.uuid().parse(id),
        C.TransferSchema,
        'PATCH',
        C.TransferPatchSchema.parse(input),
      ),
    summary: (from: string, to: string, signal?: AbortSignal) =>
      transport.request(
        base + '/summary' + query(C.SummaryQuerySchema.parse({ from, to })),
        C.SummarySchema,
        'GET',
        undefined,
        signal,
      ),
  };
}
