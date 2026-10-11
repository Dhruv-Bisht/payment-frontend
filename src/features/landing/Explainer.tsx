import { Link } from 'react-router-dom';

const STEPS = [
  {
    title: 'Your request arrives with a reference',
    body: 'Every payment carries a unique reference. If the same request shows up again because a connection dropped and the app retried, the server returns the original result instead of paying twice.',
    proof: 'replayWithSameReference_returnsOriginal_andDoesNotApplyTwice',
  },
  {
    title: 'Wallets are locked in a fixed order',
    body: 'Row locks are taken lowest wallet ID first, so two people paying each other at the same moment can’t deadlock, and no update is lost.',
    proof: 'concurrentOppositeTransfers_neverDeadlock_neverLoseMoney',
  },
  {
    title: 'Rules are checked while the lock is held',
    body: 'Insufficient balance, inactive wallets and currency mismatches are rejected. The database itself also refuses a negative balance, as a last line of defence.',
    proof: 'insufficientBalance_isRejected_andChangesNothing',
  },
  {
    title: 'The payment is written twice',
    body: 'A debit on one account and an equal credit on another. Ledger rows can’t be edited or deleted: the database rejects it.',
    proof: 'journalEntry_hasBalancedLegs_andIsOnlyVisibleToParticipants',
  },
  {
    title: 'The event is saved with the payment',
    body: 'An outbox row is written in the same database transaction, so a payment can never commit without its event, or the other way round.',
    proof: 'everyCompletedTransaction_writesExactlyOneOutboxEvent',
  },
  {
    title: 'The event is published, effectively once',
    body: 'A background relay sends outbox rows to Kafka. Delivery is at-least-once, and consumers ignore duplicates by event ID.',
    proof: 'NotificationEventConsumer dedupes on eventId',
  },
];

interface Where {
  label: string;
  to: string;
  admin?: boolean;
}

const GUARANTEES: { what: string; how: string; where: Where }[] = [
  { what: 'A retry never charges twice', how: 'Reference key, unique per wallet, checked under the wallet lock', where: { label: 'Reliability lab', to: '/lab' } },
  { what: 'Concurrent payments lose no money', how: 'Pessimistic row locks and READ_COMMITTED isolation', where: { label: 'Reliability lab', to: '/lab' } },
  { what: 'The books always balance', how: 'Double-entry ledger; total debits equal total credits', where: { label: 'Admin overview', to: '/admin', admin: true } },
  { what: 'Every wallet matches its ledger', how: 'Balance is reconciled against credits minus debits', where: { label: 'Admin wallets', to: '/admin/wallets', admin: true } },
  { what: 'Nobody sees someone else’s data', how: 'Ownership-scoped queries; 404 for anything that isn’t yours', where: { label: 'Reliability lab', to: '/lab' } },
  { what: 'Events are never lost', how: 'Transactional outbox, then a relay to Kafka', where: { label: 'Admin pipeline', to: '/admin/pipeline', admin: true } },
];

const CUSTOMER_FEATURES = [
  'Create an account; a wallet is set up automatically',
  'Add money, send to another wallet, or withdraw, with a review step before anything moves',
  'Safe automatic retries when the connection drops',
  'Balance trail chart and a full activity history',
  'Open any payment to see its journal entry: the debit and credit legs',
  'Your own ledger in debit and credit columns',
  'Reliability lab: run the guarantees live against your own wallet',
  'Session details, including when your login expires',
];

const OPERATOR_FEATURES = [
  'Platform overview: users, wallets, transactions, money held, volume by type',
  'Trial balance: do total debits equal total credits?',
  'Reconcile every wallet against its ledger, and inspect any one in detail',
  'Backfill an opening balance, with safeguards',
  'Every transaction on the platform, with its journal entry',
  'Event pipeline: outbox backlog, recent events and their payloads',
  'Live service metrics and health, plus automatic background self-checks',
];

export function Explainer({ signedIn, isAdmin = false }: { signedIn: boolean; isAdmin?: boolean }) {
  return (
    <>
      <section className="band" aria-labelledby="steps-h">
        <h2 id="steps-h">What happens when you press Send</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <p className="proof small">
                Proven by <code>{s.proof}</code>
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band" aria-labelledby="guarantees-h">
        <h2 id="guarantees-h">Guarantees, and where to see each one</h2>
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Guarantee</th>
                <th scope="col">How it is enforced</th>
                <th scope="col">See it</th>
              </tr>
            </thead>
            <tbody>
              {GUARANTEES.map((g) => (
                <tr key={g.what}>
                  <th scope="row" className="plain">{g.what}</th>
                  <td>{g.how}</td>
                  <td>
                    {signedIn && (!g.where.admin || isAdmin) ? (
                      <Link className="link" to={g.where.to}>{g.where.label}</Link>
                    ) : (
                      <span className="muted">{g.where.label}{g.where.admin ? ' (admin)' : ''}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="band two-col" aria-labelledby="features-h">
        <h2 id="features-h" className="sr-only">Features</h2>
        <div>
          <h3>For customers</h3>
          <ul className="plain-list">{CUSTOMER_FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
        <div>
          <h3>For operators</h3>
          <ul className="plain-list">{OPERATOR_FEATURES.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      </section>

      <section className="band" aria-labelledby="stack-h">
        <h2 id="stack-h">Built with</h2>
        <p className="muted">
          Java 21 and Spring Boot 4, MySQL 8 with Flyway migrations, Apache Kafka, JWT authentication, React and
          TypeScript, Docker Compose, and tests that run against a real database in CI.
        </p>
      </section>
    </>
  );
}
