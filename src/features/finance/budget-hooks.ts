import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { Currency } from './contracts.generated';
export function useBudgetSummary(month: string, currency: Currency, ready: boolean) {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({
    queryKey: ['private', 'finance', session?.user.id, 'budget', month, currency],
    queryFn: ({ signal }) => finance.budgetSummary(month, currency, signal),
    enabled: !!session && ready,
  });
}
