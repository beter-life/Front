import { useQuery } from '@tanstack/react-query';
import { useAuthV2 } from '../../auth-v2/hooks';
export function useReconciliationQuery<T>(name:string,filters:unknown,load:(signal:AbortSignal)=>Promise<T>,enabled=true){
  const {session}=useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'reconciliation',name,filters],queryFn:({signal})=>load(signal),enabled:!!session&&enabled});
}
