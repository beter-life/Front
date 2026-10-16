import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { ImportHistoryQuery } from './contracts.generated';
export function useImportPreview(id:string,offset:number){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'import-preview',id,offset],queryFn:({signal})=>finance.importPreview(id,{offset:String(offset)},signal),enabled:!!session&&!!id});}
export function useImportHistory(cursor:ImportHistoryQuery){const {finance}=useServices(),{session}=useAuthV2();return useQuery({queryKey:['private','finance',session?.user.id,'import-history',cursor],queryFn:({signal})=>finance.importHistory(cursor,signal),enabled:!!session});}
