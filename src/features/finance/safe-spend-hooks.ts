import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { Currency } from './contracts.generated';
export function useSafeSpendSettings(currency:Currency) {
  const {finance}=useServices(),{session}=useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'safe-spend-settings',currency],queryFn:({signal})=>finance.safeSpendSettings(currency,signal),enabled:!!session});
}
export function useSafeSpend(currency:Currency,configured:boolean) {
  const {finance}=useServices(),{session}=useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'safe-spend',currency],queryFn:({signal})=>finance.safeSpend(currency,signal),enabled:!!session&&configured,staleTime:0});
}
