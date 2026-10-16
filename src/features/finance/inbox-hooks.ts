import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { InboxQuery } from './contracts.generated';
export function useInbox(filters:InboxQuery) {
  const {finance}=useServices(),{session}=useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'inbox',filters],queryFn:({signal})=>finance.inbox(filters,signal),enabled:!!session});
}
export function useInboxReview(id:string) {
  const {finance}=useServices(),{session}=useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'inbox-review',id],queryFn:({signal})=>finance.inboxReview(id,signal),enabled:!!session&&!!id});
}
