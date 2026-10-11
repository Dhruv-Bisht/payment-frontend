import { Badge, ErrorNotice, Skeleton } from '../../components/ui';
import { bytes, duration, when } from '../../lib/format';
import { has, total } from '../../lib/prometheus';
import { useHealth } from '../system/useHealth';
import { StatusChip } from '../../components/ui';
import { useAdminOutbox, useMetrics } from './hooks';

function pretty(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

export default function AdminPipelinePage() {
  const outbox = useAdminOutbox();
  const metrics = useMetrics();
  const health = useHealth();
  const m = metrics.data;

  const rows = m
    ? [
        { label: 'Outbox events waiting', value: String(total(m, 'outbox_pending_events')), hint: 'Should stay near zero. A growing number means the relay or Kafka is unhealthy.' },
        { label: 'Ledger imbalances detected', value: String(total(m, 'ledger_imbalance_detected_total')), hint: 'Must stay at zero. A background job checks debits against credits every few minutes.' },
        { label: 'Heap memory in use', value: bytes(total(m, 'jvm_memory_used_bytes', { area: 'heap' })), hint: 'Java heap of the API process.' },
        { label: 'Database connections in use', value: has(m, 'hikaricp_connections_active') ? String(total(m, 'hikaricp_connections_active')) : 'n/a', hint: 'Active connections from the pool.' },
        { label: 'HTTP requests served', value: String(Math.round(total(m, 'http_server_requests_seconds_count'))), hint: 'Since the process started.' },
        { label: 'Uptime', value: duration(total(m, 'process_uptime_seconds')), hint: 'Since the API process started.' },
      ]
    : [];

  return (
    <>
      <p className="muted lede">
        How events leave the system. Each payment writes an outbox row in the same database transaction; a relay
        publishes it, and downstream consumers ignore duplicates. Refreshes every 5 seconds.
      </p>

      {outbox.isPending && <Skeleton height={80} />}
      {outbox.isError && <ErrorNotice error={outbox.error} onRetry={() => outbox.refetch()} />}
      {outbox.data && (
        <dl className="stats">
          <div><dt>Waiting</dt><dd>{outbox.data.pending}</dd></div>
          <div><dt>Published</dt><dd>{outbox.data.published}</dd></div>
          <div><dt>Publisher</dt><dd>{outbox.data.publisher === 'kafka' ? 'Kafka' : 'Log only'}</dd></div>
          <div><dt>Health</dt><dd><StatusChip state={health.data} /></dd></div>
        </dl>
      )}
      {outbox.data?.publisher === 'log' && (
        <p className="notice">Kafka is switched off in this deployment, so events are written to the application log instead. The outbox still runs end to end.</p>
      )}

      <section className="check" aria-labelledby="metrics-h">
        <h2 id="metrics-h">Live service metrics</h2>
        {metrics.isPending && <Skeleton height={120} />}
        {metrics.isError && <ErrorNotice error={metrics.error} onRetry={() => metrics.refetch()} />}
        {m && (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col" className="num">Value</th>
                  <th scope="col">What it tells you</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="plain">{r.label}</th>
                    <td className="num">{r.value}</td>
                    <td className="muted small">{r.hint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="check" aria-labelledby="events-h">
        <h2 id="events-h">Recent events</h2>
        {outbox.data && outbox.data.recent.length === 0 && <p className="empty">No events yet. Make a payment to create one.</p>}
        {outbox.data && outbox.data.recent.length > 0 && (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Event</th>
                  <th scope="col">Wallet</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Attempts</th>
                  <th scope="col">Created</th>
                  <th scope="col">Payload</th>
                </tr>
              </thead>
              <tbody>
                {outbox.data.recent.map((e) => (
                  <tr key={e.id}>
                    <td>#{e.id}</td>
                    <td>{e.eventType}</td>
                    <td>{e.aggregateId}</td>
                    <td>{e.status === 'PUBLISHED' ? <Badge tone="ok">Published</Badge> : <Badge>Waiting</Badge>}</td>
                    <td className="num">{e.attempts}</td>
                    <td>{when(e.createdAt)}</td>
                    <td>
                      <details>
                        <summary className="link">View</summary>
                        <pre className="payload">{pretty(e.payload)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
