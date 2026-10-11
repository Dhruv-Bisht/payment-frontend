import { buildBalanceSeries } from './balanceSeries';
import type { LedgerEntry } from './types';

const entry = (id: number, type: 'DEBIT' | 'CREDIT', amount: number): LedgerEntry => ({
  ledgerEntryId: id,
  transactionId: id,
  walletId: 1,
  systemAccount: null,
  amount,
  type,
  createdAt: `2026-10-0${id}T10:00:00`,
});

describe('buildBalanceSeries', () => {
  it('walks backwards from the current balance and returns oldest first', () => {
    // newest first: +50, -20, +100  => balances 100, 80, 130 (current 130)
    const series = buildBalanceSeries([entry(3, 'CREDIT', 50), entry(2, 'DEBIT', 20), entry(1, 'CREDIT', 100)], 130);
    expect(series.map((p) => p.balance)).toEqual([100, 80, 130]);
  });

  it('stays correct when only the latest page of history is loaded', () => {
    const series = buildBalanceSeries([entry(3, 'CREDIT', 50), entry(2, 'DEBIT', 20)], 130);
    expect(series.map((p) => p.balance)).toEqual([80, 130]);
  });

  it('returns nothing for an empty history', () => {
    expect(buildBalanceSeries([], 0)).toEqual([]);
  });
});
