import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { YieldEstimateQuery } from './contracts.generated';
export function useYieldBenchmarks(){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'yield-benchmarks'],queryFn:({signal})=>finance.yieldBenchmarks(signal),enabled:!!session,staleTime:300000});}
export function useYieldProfiles(){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'yield-profiles'],queryFn:({signal})=>finance.yieldProfiles(signal),enabled:!!session});}
export function useYieldEstimate(id:string,q:YieldEstimateQuery,enabled=true){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'yield-estimate',id,q],queryFn:({signal})=>finance.yieldEstimate(id,q,signal),enabled:!!session&&enabled});}
export function useYieldSummary(q:YieldEstimateQuery){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'yield-summary',q],queryFn:({signal})=>finance.yieldSummary(q,signal),enabled:!!session});}
