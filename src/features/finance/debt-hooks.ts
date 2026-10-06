import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { DebtPaymentQuery } from './contracts.generated';
export function useDebts(){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'debts'],queryFn:({signal})=>finance.debts(signal),enabled:!!session});}
export function useDebt(id:string){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'debt',id],queryFn:({signal})=>finance.debt(id,signal),enabled:!!session&&!!id});}
export function useDebtSummary(){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'debt-summary'],queryFn:({signal})=>finance.debtSummary(signal),enabled:!!session});}
export function useDebtPayments(id:string,q:DebtPaymentQuery){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'debt-payments',id,q],queryFn:({signal})=>finance.debtPayments(id,q,signal),enabled:!!session&&!!id});}
