import type { Card } from './contracts.generated';

/** Presentation lookup only: never infer a relationship from account name/type. */
export function linkedCard(cards: readonly Card[] | undefined, accountId: string | null) {
  return cards?.find(card => card.accountId === accountId);
}
