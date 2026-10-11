import { Sheet } from '../../components/Sheet';
import { Badge, ErrorNotice, Skeleton } from '../../components/ui';
import { money, when } from '../../lib/format';
import { txDate } from '../../lib/types';
import type { LedgerEntry, Transaction } from '../../lib/types';
import { useEntries, useTransaction } from '../wallet/queries';
import { describeTx } from './describe';

const SYSTEM_LABEL: Record<string, string> = {
  EXTERNAL_CLEARING: 'External clearing (bank or card)',
  OPENING_EQUITY: 'Opening equity',
};

function accountLabel(e: LedgerEntry, myWalletId?: number) {
  if (e.systemAccount) return SYSTEM_LABEL[e.systemAccount] ?? e.systemAccount;
  return myWalletId !== undefined && e.walletId === myWalletId ? 'Your wallet' : `Wallet ${e.walletId}`;
}

const sum = (entries: LedgerEntry[], type: LedgerEntry['type']) =>
  Math.round(entries.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0) * 100) / 100;

/**
 * A payment shown as the accounting journal entry it really is.
 * scope "me": loads the transaction by id (the server returns 404 unless it is yours).
 * scope "admin": the operator view; the transaction summary comes from the list row.
 */
export function TransactionSheet({
  transactionId,
  walletId,
  scope = 'me',
  hint,
  onClose,
}: {
  transactionId: number | null;
  walletId?: number;
  scope?: 'me' | 'admin';
  hint?: Transaction | null;
  onClose: () => void;
}) {
  const mine = useTransaction(scope === 'me' ? transactionId : null);
  const blocked = scope === 'me' && mine.isError;
  const entries = useEntries(blocked ? null : transactionId, scope);
  const tx: Transaction | undefined = scope === 'me' ? mine.data : (hint ?? undefined);

  const debits = entries.data ? sum(entries.data, 'DEBIT') : 0;
  const credits = entries.data ? sum(entries.data, 'CREDIT') : 0;

  return (
    <Sheet open={transactionId !== null} onClose={onClose} title={transactionId !== null ? `Transaction #${transactionId}` : ''}>
      {scope === 'me' && mine.isPending && transactionId !== null && <Skeleton height={120} />}
      {blocked && (
        <>
          <ErrorNotice error={mine.error} />
          <p className="muted small">
            It either doesn’t exist or isn’t yours. The server answers the same way for both, so IDs can’t be probed.
          </p>
        </>
      )}

      {tx && (
        <>
          <dl className="facts">
            <dt>What</dt>
            <dd>{describeTx(tx, walletId).title}</dd>
            <dt>Amount</dt>
            <dd>{money(tx.amount)}</dd>
            <dt>When</dt>
            <dd>{when(txDate(tx))}</dd>
            <dt>Status</dt>
            <dd>{tx.status === 'COMPLETED' ? <Badge tone="ok">Completed</Badge> : <Badge>{tx.status}</Badge>}</dd>
            <dt>Reference</dt>
            <dd className="ref">{tx.referenceId}</dd>
          </dl>

          <h3>Journal entry</h3>
          <p className="muted small">
            Every payment is written as a debit and an equal credit, so money is never created or lost.
          </p>

          {entries.isPending && <Skeleton height={90} />}
          {entries.isError && <ErrorNotice error={entries.error} onRetry={() => entries.refetch()} />}
          {entries.data && (
            <div className="table-wrap">
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">Account</th>
                    <th scope="col" className="num">Debit</th>
                    <th scope="col" className="num">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.data.map((e) => (
                    <tr key={e.ledgerEntryId}>
                      <td>{accountLabel(e, scope === 'me' ? walletId : undefined)}</td>
                      <td className="num debit">{e.type === 'DEBIT' ? money(e.amount) : ''}</td>
                      <td className="num credit">{e.type === 'CREDIT' ? money(e.amount) : ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">
                      Totals {debits === credits ? <Badge tone="ok">Balanced</Badge> : <Badge tone="bad">Out of balance</Badge>}
                    </th>
                    <td className="num">{money(debits)}</td>
                    <td className="num">{money(credits)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
