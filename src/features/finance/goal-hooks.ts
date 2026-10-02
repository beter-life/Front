import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { GoalQuery, GoalEventsPage } from './contracts.generated';
export function useGoals(filters: GoalQuery) {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({ queryKey: ['private', 'finance', session?.user.id, 'goals', filters], queryFn: ({ signal }) => finance.goals(filters, signal), enabled: !!session });
}
export function useGoal(id: string) {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useQuery({ queryKey: ['private', 'finance', session?.user.id, 'goal', id], queryFn: ({ signal }) => finance.goal(id, signal), enabled: !!session });
}
export function useGoalEvents(id: string) {
  const { finance } = useServices();
  const { session } = useAuthV2();
  return useInfiniteQuery({ queryKey: ['private', 'finance', session?.user.id, 'goal-events', id], initialPageParam: null as GoalEventsPage['nextCursor'], queryFn: ({ pageParam, signal }) => finance.goalEvents(id, { limit: '50', ...(pageParam ? { cursorAt: pageParam.occurredAt, cursorId: pageParam.id } : {}) }, signal), getNextPageParam: last => last.nextCursor ?? undefined, enabled: !!session });
}
