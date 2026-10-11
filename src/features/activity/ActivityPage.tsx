import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ErrorNotice, Pager, Skeleton } from '../../components/ui';
import { pageCount } from '../../lib/types';
import { useTransactions, useWallet } from '../wallet/queries';
import { TransactionSheet } from './TransactionSheet';
import { TransactionTable } from './TransactionTable';

/** /activity lists payments; /activity/:id opens one payment's journal entry (a shareable link). */
export default function ActivityPage() {
  const [page, setPage] = useState(0);
  const { id } = useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const tx = useTransactions(page, 15);

  const parsed = id !== undefined ? Number(id) : NaN;
  const selectedId = Number.isInteger(parsed) && parsed > 0 ? parsed : null;

  return (
    <>
      <h1>Activity</h1>
      <p className="muted lede">Select a payment to see its journal entry. Each one has its own link you can share.</p>
      {tx.isPending && <Skeleton height={240} />}
      {tx.isError && <ErrorNotice error={tx.error} onRetry={() => tx.refetch()} />}
      {tx.data && (
        <>
          <TransactionTable
            items={tx.data.content}
            walletId={wallet.data?.walletId}
            onSelect={(t) => navigate(`/activity/${t.transactionId}`)}
          />
          <Pager page={page} pages={pageCount(tx.data)} onPage={setPage} />
        </>
      )}
      <TransactionSheet transactionId={selectedId} walletId={wallet.data?.walletId} onClose={() => navigate('/activity')} />
    </>
  );
}
