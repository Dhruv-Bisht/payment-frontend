import { useState } from 'react';
import { ErrorNotice, Pager, Skeleton } from '../../components/ui';
import { money, when } from '../../lib/format';
import { pageCount, txDate } from '../../lib/types';
import type { Transaction } from '../../lib/types';
import { TransactionSheet } from '../activity/TransactionSheet';
import { useAdminTransactions } from './hooks';

const TYPE_LABEL: Record<string, string> = {
  TOP_UP: 'Top-up',
  TRANSFER: 'Transfer',
  WITHDRAWAL: 'Withdrawal',
  OPENING_BALANCE: 'Opening balance',
};

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const tx = useAdminTransactions(page, 15);

  return (
    <>
      <p className="muted lede">Every transaction on the platform, newest first. Select one to inspect its journal entry.</p>
      {tx.isPending && <Skeleton height={240} />}
      {tx.isError && <ErrorNotice error={tx.error} onRetry={() => tx.refetch()} />}
      {tx.data && (
        <>
          {tx.data.content.length === 0 ? (
            <p className="empty">No transactions yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Transaction</th>
                    <th scope="col">Type</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                    <th scope="col" className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tx.data.content.map((t) => (
                    <tr key={t.transactionId}>
                      <td>{when(txDate(t))}</td>
                      <td>
                        <button className="row-link" onClick={() => setSelected(t)}>#{t.transactionId}</button>
                      </td>
                      <td>{TYPE_LABEL[t.type] ?? t.type}</td>
                      <td>{t.senderWalletId ?? <span className="muted">External</span>}</td>
                      <td>{t.receiverWalletId ?? <span className="muted">External</span>}</td>
                      <td className="num">{money(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager page={page} pages={pageCount(tx.data)} onPage={setPage} />
        </>
      )}
      <TransactionSheet
        scope="admin"
        transactionId={selected?.transactionId ?? null}
        hint={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
