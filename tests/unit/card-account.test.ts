import { describe, expect, it } from 'vitest';
import { linkedCard } from '../../src/features/finance/card-account-view';
import { bankAccount, cardAccount, cardFixture } from '../fixtures/cards';

describe('card/account presentation relationship', () => {
  it('uses only the official accountId reference', () => {
    expect(linkedCard([cardFixture],cardAccount.id)).toBe(cardFixture);
    expect(linkedCard([cardFixture],bankAccount.id)).toBeUndefined();
    expect(linkedCard([cardFixture],null)).toBeUndefined();
  });
  it('retains archived links and does not manufacture a link from unavailable data', () => {
    const archived={...cardFixture,status:'ARCHIVED' as const,archivedAt:cardFixture.createdAt};
    expect(linkedCard([archived],cardAccount.id)).toBe(archived);
    expect(linkedCard([],cardAccount.id)).toBeUndefined();
    expect(linkedCard(undefined,cardAccount.id)).toBeUndefined();
  });
});
