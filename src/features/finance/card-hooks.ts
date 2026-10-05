import { useQuery } from '@tanstack/react-query';
import { useServices } from '../../hooks/use-services';
import { useAuthV2 } from '../../auth-v2/hooks';
import type { PurchaseQuery } from './contracts.generated';
export function useCards() { const { finance } = useServices(), { session } = useAuthV2(); return useQuery({ queryKey: ['private', 'finance', session?.user.id, 'cards'], queryFn: ({ signal }) => finance.cards(signal), enabled: !!session }); }
export function useCard(id: string) { const { finance } = useServices(), { session } = useAuthV2(); return useQuery({ queryKey: ['private', 'finance', session?.user.id, 'card', id], queryFn: ({ signal }) => finance.card(id, signal), enabled: !!session && !!id }); }
export function useCardPurchases(id: string, query: PurchaseQuery) { const { finance } = useServices(), { session } = useAuthV2(); return useQuery({ queryKey: ['private', 'finance', session?.user.id, 'card-purchases', id, query], queryFn: ({ signal }) => finance.cardPurchases(id, query, signal), enabled: !!session && !!id }); }
export function useCardsSummary() { const { finance } = useServices(), { session } = useAuthV2(); return useQuery({ queryKey: ['private', 'finance', session?.user.id, 'cards-summary'], queryFn: ({ signal }) => finance.cardsSummary(signal), enabled: !!session }); }
