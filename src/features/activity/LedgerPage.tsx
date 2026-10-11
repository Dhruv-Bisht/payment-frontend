import { useState } from 'react';
import { ErrorNotice, Pager, Skeleton } from '../../components/ui';
import { money, when } from '../../lib/format';
import { pageCount } from '../../lib/types';
import { useLedger } from '../wallet/queries';

export default function LedgerPage() {
  const [page, setPage] = useState(0);
  const ledger = useLedger(page, 15);

  return (
    <>
      <h1>Ledger</h1>
      <p className="muted lede">
        Your wallet’s side of every journal entry. Your balance is credits minus debits, and entries can’t be edited
        once written.
      </p>
      {ledger.isPending && <Skeleton height={240} />}
      {ledger.isError && <ErrorNotice error={ledger.error} onRetry={() => ledger.refetch()} />}
      {ledger.data &&
        (ledger.data.content.length === 0 ? (
          <p className="empty">No ledger entries yet.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Transaction</th>
                    <th scope="col" className="num">Debit</th>
                    <th scope="col" className="num">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.data.content.map((e) => (
                    <tr key={e.ledgerEntryId}>
                      <td>{when(e.createdAt)}</td>
                      <td>#{e.transactionId}</td>
                      <td className="num debit">{e.type === 'DEBIT' ? money(e.amount) : ''}</td>
                      <td className="num credit">{e.type === 'CREDIT' ? money(e.amount) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} pages={pageCount(ledger.data)} onPage={setPage} />
          </>
        ))}
    </>
  );
}
