import { useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { TransactionQuery } from './contracts.generated';
export function useAccounts() {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({
    queryKey: ['private', 'finance', session?.user.id, 'accounts'],
    queryFn: ({ signal }) => finance.accounts(signal),
    enabled: !!session,
  });
}
export function useCategories() {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({
    queryKey: ['private', 'finance', session?.user.id, 'categories'],
    queryFn: ({ signal }) => finance.categories(signal),
    enabled: !!session,
  });
}
export function useTransactions(filters: TransactionQuery) {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({
    queryKey: ['private', 'finance', session?.user.id, 'transactions', filters],
    queryFn: ({ signal }) => finance.transactions(filters, signal),
    enabled: !!session,
  });
}
export function useSummary(from: string, to: string) {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({
    queryKey: ['private', 'finance', session?.user.id, 'summary', from, to],
    queryFn: ({ signal }) => finance.summary(from, to, signal),
    enabled: !!session,
  });
}
export function useFinanceMutation<T>(action: (input: T) => Promise<unknown>) {
  const { queryClient } = useServices();
  const { session, store } = useAuthV2();
  const owner = session?.user.id;
  const token = session?.access_token;
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      if (
        store.getSnapshot().session?.user.id !== owner ||
        store.getSnapshot().session?.access_token !== token
      )
        return;
      await queryClient.invalidateQueries({ queryKey: ['private', 'finance', owner] });
    },
  });
}
