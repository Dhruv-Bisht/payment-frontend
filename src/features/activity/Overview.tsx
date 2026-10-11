import { Link, useNavigate } from 'react-router-dom';
import { ErrorNotice, Skeleton } from '../../components/ui';
import { BalanceTrail } from '../wallet/BalanceTrail';
import { PayPanel } from '../wallet/PayPanel';
import { useTransactions, useWallet } from '../wallet/queries';
import { TransactionTable } from './TransactionTable';

export default function Overview() {
  const wallet = useWallet();
  const recent = useTransactions(0, 5);
  const navigate = useNavigate();

  return (
    <>
      <h1 className="sr-only">Overview</h1>
      <div className="overview">
        <div className="overview-main">
          <BalanceTrail />
          <section aria-labelledby="recent-h">
            <div className="section-head">
              <h2 id="recent-h">Recent activity</h2>
              <Link to="/activity" className="link">See all activity</Link>
            </div>
            {recent.isPending && <Skeleton height={120} />}
            {recent.isError && <ErrorNotice error={recent.error} onRetry={() => recent.refetch()} />}
            {recent.data && (
              <TransactionTable
                items={recent.data.content}
                walletId={wallet.data?.walletId}
                onSelect={(t) => navigate(`/activity/${t.transactionId}`)}
              />
            )}
          </section>
        </div>
        <aside className="overview-side">
          <PayPanel wallet={wallet.data} />
        </aside>
      </div>
    </>
  );
}
