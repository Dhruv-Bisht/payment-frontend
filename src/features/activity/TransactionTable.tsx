import { money, when } from '../../lib/format';
import { txDate } from '../../lib/types';
import type { Transaction } from '../../lib/types';
import { describeTx } from './describe';

export function TransactionTable({
  items,
  walletId,
  onSelect,
}: {
  items: Transaction[];
  walletId?: number;
  onSelect: (t: Transaction) => void;
}) {
  if (items.length === 0) {
    return <p className="empty">No activity yet. Add money to make your first entry.</p>;
  }
  return (
    <div className="table-wrap">
      <table className="ledger">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col" className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t) => {
            const { title, outgoing } = describeTx(t, walletId);
            return (
              <tr key={t.transactionId}>
                <td>{when(txDate(t))}</td>
                <td>
                  <button className="row-link" onClick={() => onSelect(t)} aria-label={`${title}, transaction ${t.transactionId}. View journal entry`}>
                    {title}
                  </button>
                </td>
                <td className={outgoing ? 'num debit' : 'num credit'}>
                  {outgoing ? '−' : '+'}
                  {money(t.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
