import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { RecurrenceQuery, RecurrencePage, CalendarQuery, RadarQuery } from './contracts.generated';
export function useRecurrences(filters: RecurrenceQuery) {
  const { finance } = useServices(), { session } = useAuthV2();
  return useInfiniteQuery({ queryKey: ['private','finance',session?.user.id,'recurrences',filters], initialPageParam: null as RecurrencePage['nextCursor'], queryFn: ({pageParam,signal}) => finance.recurrences({ ...filters, limit:'50', ...(pageParam ? {cursorAt:pageParam.createdAt,cursorId:pageParam.id} : {}) },signal), getNextPageParam:last=>last.nextCursor??undefined, enabled:!!session });
}
export function useFinancialCalendar(filters: CalendarQuery) {
  const { finance } = useServices(), { session } = useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'calendar',filters],queryFn:({signal})=>finance.calendar(filters,signal),enabled:!!session});
}
export function useSubscriptionRadar(filters: RadarQuery) {
  const { finance } = useServices(), { session } = useAuthV2();
  return useQuery({queryKey:['private','finance',session?.user.id,'subscription-radar',filters],queryFn:({signal})=>finance.subscriptionRadar(filters,signal),enabled:!!session});
}
