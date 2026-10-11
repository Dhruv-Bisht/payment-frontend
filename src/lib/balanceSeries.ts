import type { LedgerEntry } from './types';

export interface BalancePoint {
  at: string;
  balance: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Rebuilds the balance after each ledger entry by walking BACKWARDS from the current balance, so the
 * numbers stay correct even when only the latest page of history is loaded.
 * `entries` must be newest first (as the API returns them). Output is oldest first.
 */
export function buildBalanceSeries(entries: LedgerEntry[], currentBalance: number): BalancePoint[] {
  let running = currentBalance;
  const points: BalancePoint[] = [];
  for (const e of entries) {
    points.push({ at: e.createdAt, balance: round2(running) });
    running = e.type === 'CREDIT' ? running - e.amount : running + e.amount;
  }
  return points.reverse();
}
