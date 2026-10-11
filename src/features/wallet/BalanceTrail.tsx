import { useMemo, useState } from 'react';
import { ErrorNotice, Badge, Skeleton } from '../../components/ui';
import { buildBalanceSeries } from '../../lib/balanceSeries';
import type { BalancePoint } from '../../lib/balanceSeries';
import { money } from '../../lib/format';
import { useLedger, useWallet } from './queries';

const W = 640;
const H = 170;
const PAD = 10;

/** Balance holds steady between payments, so the line is a step chart rather than a slope. */
function TrailChart({ points, current }: { points: BalancePoint[]; current: number }) {
  const values = points.map((p) => p.balance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (points.length === 1 ? 0.5 : i / (points.length - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);

  let line = `M${x(0).toFixed(1)} ${y(points[0].balance).toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    line += ` H${x(i).toFixed(1)} V${y(points[i].balance).toFixed(1)}`;
  }
  const area = `${line} V${H - PAD} H${x(0).toFixed(1)} Z`;
  const last = points[points.length - 1];

  return (
    <>
      <svg className="trail-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="trail-title trail-desc">
        <title id="trail-title">Balance trail</title>
        <desc id="trail-desc">
          {`Over your last ${points.length} movements the balance ranged from ${money(min)} to ${money(max)} and is now ${money(current)}.`}
        </desc>
        <path d={area} className="trail-area" />
        <path d={line} className="trail-line" />
        <circle cx={x(points.length - 1)} cy={y(last.balance)} r="4.5" className="trail-dot" />
      </svg>
      <p className="trail-scale muted small">
        <span>Low {money(min)}</span>
        <span>High {money(max)}</span>
      </p>
    </>
  );
}

export function BalanceTrail() {
  const wallet = useWallet();
  const ledger = useLedger(0, 100);
  const [copied, setCopied] = useState(false);

  const points = useMemo(
    () => (wallet.data && ledger.data ? buildBalanceSeries(ledger.data.content, wallet.data.balance) : []),
    [wallet.data, ledger.data]
  );

  async function copyId() {
    if (!wallet.data) return;
    try {
      await navigator.clipboard.writeText(String(wallet.data.walletId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; the ID is visible anyway */
    }
  }

  if (wallet.isError) return <ErrorNotice error={wallet.error} onRetry={() => wallet.refetch()} />;

  return (
    <section className="trail" aria-labelledby="balance-h">
      <h2 id="balance-h" className="sr-only">Balance</h2>
      <div className="trail-head">
        <p className="balance">{wallet.data ? money(wallet.data.balance) : <Skeleton width={180} height={34} />}</p>
        {wallet.data && (
          <p className="wallet-id">
            Wallet ID <strong>{wallet.data.walletId}</strong>{' '}
            <button className="link" onClick={copyId}>
              {copied ? 'Copied' : 'Copy'}
            </button>{' '}
            {wallet.data.status !== 'ACTIVE' && <Badge tone="bad">Not active</Badge>}
          </p>
        )}
      </div>

      {ledger.isPending ? (
        <Skeleton height={H} />
      ) : points.length === 0 ? (
        <p className="empty">Your balance trail appears after your first payment.</p>
      ) : (
        <TrailChart points={points} current={wallet.data?.balance ?? 0} />
      )}
    </section>
  );
}
