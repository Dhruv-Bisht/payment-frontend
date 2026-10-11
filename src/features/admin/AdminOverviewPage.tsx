import { Link } from 'react-router-dom';
import { Badge, ErrorNotice, Skeleton, StatusChip } from '../../components/ui';
import { money } from '../../lib/format';
import { useHealth } from '../system/useHealth';
import { useAdminOverview, useAdminWallets, useTrialBalance } from './hooks';

const round2 = (n: number) => Math.round(n * 100) / 100;
const TYPE_LABEL: Record<string, string> = {
  TOP_UP: 'Top-ups',
  TRANSFER: 'Transfers',
  WITHDRAWAL: 'Withdrawals',
  OPENING_BALANCE: 'Opening balances',
};

export default function AdminOverviewPage() {
  const overview = useAdminOverview();
  const trial = useTrialBalance();
  const wallets = useAdminWallets(0, 100);
  const health = useHealth();

  const o = overview.data;
  const total = (type: string) => o?.byType.find((t) => t.type === type)?.total ?? 0;
  const netInflow = round2(total('TOP_UP') - total('WITHDRAWAL'));
  const conserved = o ? round2(o.moneyHeld) === netInflow : false;

  const checked = wallets.data?.content ?? [];
  const mismatches = checked.filter((w) => !w.consistent).length;
  const walletTotal = wallets.data?.totalElements ?? checked.length;

  return (
    <>
      <p className="muted lede">
        A live view of the platform and the checks that prove the books are correct. Refreshes automatically.
      </p>

      {overview.isError && <ErrorNotice error={overview.error} onRetry={() => overview.refetch()} />}
      {overview.isPending && <Skeleton height={80} />}
      {o && (
        <dl className="stats">
          <div><dt>Users</dt><dd>{o.users}</dd></div>
          <div><dt>Wallets</dt><dd>{o.wallets}</dd></div>
          <div><dt>Transactions</dt><dd>{o.transactions}</dd></div>
          <div><dt>Ledger entries</dt><dd>{o.ledgerEntries}</dd></div>
          <div><dt>Money held</dt><dd>{money(o.moneyHeld)}</dd></div>
        </dl>
      )}

      <section className="check" aria-labelledby="checks-h">
        <h2 id="checks-h">Integrity checks</h2>
        <ul className="checks">
          <li>
            <div>
              <strong>Trial balance</strong>
              <p className="muted small">
                {trial.data
                  ? `Total debits ${money(trial.data.totalDebits)}, total credits ${money(trial.data.totalCredits)}.`
                  : 'Total debits must equal total credits.'}
              </p>
            </div>
            <div className="check-result">
              {trial.isPending ? <Badge>Checking…</Badge> : trial.isError ? <Badge tone="bad">Failed to run</Badge> : trial.data.balanced ? <Badge tone="ok">Balanced</Badge> : <Badge tone="bad">Out of balance</Badge>}
              <button className="link" onClick={() => trial.refetch()}>Run again</button>
            </div>
          </li>
          <li>
            <div>
              <strong>Wallet reconciliation</strong>
              <p className="muted small">
                {wallets.data
                  ? `${checked.length} of ${walletTotal} wallets checked against their ledger.`
                  : 'Every wallet balance must equal its credits minus debits.'}
              </p>
            </div>
            <div className="check-result">
              {wallets.isPending ? <Badge>Checking…</Badge> : mismatches === 0 ? <Badge tone="ok">All match</Badge> : <Badge tone="bad">{mismatches} mismatched</Badge>}
              <Link className="link" to="/admin/wallets">Inspect wallets</Link>
            </div>
          </li>
          <li>
            <div>
              <strong>Conservation of money</strong>
              <p className="muted small">
                {o
                  ? `Added ${money(total('TOP_UP'))} minus withdrawn ${money(total('WITHDRAWAL'))} is ${money(netInflow)}. Wallets hold ${money(o.moneyHeld)}. Transfers only move money between wallets.`
                  : 'Money held must equal money added minus money withdrawn.'}
              </p>
            </div>
            <div className="check-result">
              {!o ? <Badge>Checking…</Badge> : conserved ? <Badge tone="ok">Matches</Badge> : <Badge tone="bad">Differs</Badge>}
            </div>
          </li>
          <li>
            <div>
              <strong>Event pipeline</strong>
              <p className="muted small">
                {o ? `${o.outboxPending} waiting, ${o.outboxPublished} published, via ${o.eventPublisher === 'kafka' ? 'Kafka' : 'the log (Kafka is off)'}.` : 'Outbox events waiting to be published.'}
              </p>
            </div>
            <div className="check-result">
              {!o ? <Badge>Checking…</Badge> : o.outboxPending === 0 ? <Badge tone="ok">Up to date</Badge> : <Badge>{o.outboxPending} waiting</Badge>}
              <Link className="link" to="/admin/pipeline">Open pipeline</Link>
            </div>
          </li>
          <li>
            <div>
              <strong>Service health</strong>
              <p className="muted small">The public liveness check, polled every 30 seconds.</p>
            </div>
            <div className="check-result"><StatusChip state={health.data} /></div>
          </li>
        </ul>
      </section>

      {o && o.byType.length > 0 && (
        <section className="check" aria-labelledby="volume-h">
          <h2 id="volume-h">Volume by type</h2>
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col" className="num">Count</th>
                  <th scope="col" className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {o.byType.map((t) => (
                  <tr key={t.type}>
                    <td>{TYPE_LABEL[t.type] ?? t.type}</td>
                    <td className="num">{t.count}</td>
                    <td className="num">{money(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
