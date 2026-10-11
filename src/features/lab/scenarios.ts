import { api } from '../../lib/api';
import { ApiError } from '../../lib/client';
import { money, shortKey } from '../../lib/format';
import { newKey } from '../../lib/idempotency';

export interface LogLine {
  tone: 'info' | 'ok' | 'bad';
  text: string;
}
export interface Scenario {
  id: string;
  title: string;
  proves: string;
  addsMoney: boolean;
  run: () => Promise<LogLine[]>;
}

const info = (text: string): LogLine => ({ tone: 'info', text });
const ok = (text: string): LogLine => ({ tone: 'ok', text });
const bad = (text: string): LogLine => ({ tone: 'bad', text });
const near = (a: number, b: number) => Math.abs(a - b) < 0.005;

/** Runs a call that is EXPECTED to fail and returns the API error (or null if it unexpectedly succeeded). */
async function expectFailure(call: () => Promise<unknown>): Promise<ApiError | null> {
  try {
    await call();
    return null;
  } catch (e) {
    if (e instanceof ApiError) return e;
    throw e;
  }
}

export async function runReplay(): Promise<LogLine[]> {
  const key = newKey();
  const before = (await api.wallet()).balance;
  const first = await api.topUp({ amount: 50, referenceId: key });
  const second = await api.topUp({ amount: 50, referenceId: key });
  const after = (await api.wallet()).balance;
  return [
    info(`Sent a ₹50.00 top-up with reference ${shortKey(key)}. Result: transaction #${first.transactionId}.`),
    info(`Sent the identical request again, as a retry after a dropped connection would. Result: transaction #${second.transactionId}.`),
    first.transactionId === second.transactionId
      ? ok('The server recognised the retry and returned the original transaction.')
      : bad('The retry created a second transaction.'),
    near(after - before, 50)
      ? ok(`Your balance rose by exactly ${money(50)} (${money(before)} to ${money(after)}).`)
      : bad(`Balance moved by ${money(after - before)}, expected ${money(50)}.`),
  ];
}

export async function runKeyReuse(): Promise<LogLine[]> {
  const key = newKey();
  const first = await api.topUp({ amount: 20, referenceId: key });
  const err = await expectFailure(() => api.topUp({ amount: 999, referenceId: key }));
  return [
    info(`Sent a ₹20.00 top-up with reference ${shortKey(key)} (transaction #${first.transactionId}).`),
    info('Sent a DIFFERENT amount (₹999.00) re-using the same reference.'),
    err?.code === 'IDEMPOTENCY_KEY_REUSED'
      ? ok(`Refused with HTTP ${err.status} IDEMPOTENCY_KEY_REUSED: a reference can’t be recycled for a different payment.`)
      : bad(err ? `Unexpected error: ${err.code ?? err.status}.` : 'The request unexpectedly succeeded.'),
  ];
}

export async function runParallelDistinct(): Promise<LogLine[]> {
  const before = (await api.wallet()).balance;
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () => api.topUp({ amount: 10, referenceId: newKey() }))
  );
  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const after = (await api.wallet()).balance;
  return [
    info('Fired 10 top-ups of ₹10.00 at the same instant, each with its own reference.'),
    info(`${succeeded} succeeded, ${10 - succeeded} failed.`),
    near(after - before, succeeded * 10)
      ? ok(`Balance rose by exactly ${money(succeeded * 10)}: no concurrent update was lost.`)
      : bad(`Balance rose by ${money(after - before)}, expected ${money(succeeded * 10)}. An update was lost.`),
  ];
}

export async function runParallelSameKey(): Promise<LogLine[]> {
  const key = newKey();
  const before = (await api.wallet()).balance;
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () => api.topUp({ amount: 100, referenceId: key }))
  );
  const ids = new Set(results.flatMap((r) => (r.status === 'fulfilled' ? [r.value.transactionId] : [])));
  const after = (await api.wallet()).balance;
  return [
    info(`Fired 10 identical ₹100.00 top-ups at the same instant, all with reference ${shortKey(key)}.`),
    info(`They returned ${ids.size} distinct transaction${ids.size === 1 ? '' : 's'}.`),
    ids.size === 1 && near(after - before, 100)
      ? ok(`Applied exactly once: balance rose by ${money(100)}, not ${money(1000)}.`)
      : bad(`Balance rose by ${money(after - before)} across ${ids.size} transactions.`),
  ];
}

export async function runInsufficientFunds(): Promise<LogLine[]> {
  const before = (await api.wallet()).balance;
  const amount = Math.min(Math.ceil(before) + 1000, 1_000_000);
  const err = await expectFailure(() => api.withdraw({ amount, referenceId: newKey() }));
  const after = (await api.wallet()).balance;
  return [
    info(`Tried to withdraw ${money(amount)} with a balance of ${money(before)}.`),
    err?.code === 'INSUFFICIENT_BALANCE'
      ? ok(`Refused with HTTP ${err.status} INSUFFICIENT_BALANCE.`)
      : bad(err ? `Unexpected error: ${err.code ?? err.status}.` : 'The withdrawal unexpectedly succeeded.'),
    near(before, after) ? ok('Balance is unchanged.') : bad(`Balance changed from ${money(before)} to ${money(after)}.`),
  ];
}

export async function runServerValidation(): Promise<LogLine[]> {
  const tooPrecise = await expectFailure(() => api.topUp({ amount: 0.001, referenceId: newKey() }));
  const tooLarge = await expectFailure(() => api.topUp({ amount: 5_000_000, referenceId: newKey() }));
  const line = (label: string, err: ApiError | null) =>
    err?.status === 400
      ? ok(`${label}: refused with HTTP 400. “${err.message}”`)
      : bad(`${label}: ${err ? `unexpected HTTP ${err.status}` : 'unexpectedly accepted'}.`);
  return [
    info('The UI validates input, but the server never trusts it. These calls skip the UI checks on purpose.'),
    line('₹0.001 (more than 2 decimals)', tooPrecise),
    line('₹5,000,000.00 (above the per-payment limit)', tooLarge),
  ];
}

export async function runNotYours(): Promise<LogLine[]> {
  const id = 2_000_000_000;
  const err = await expectFailure(() => api.transaction(id));
  return [
    info(`Requested transaction #${id}, which isn’t yours (or doesn’t exist).`),
    err?.status === 404
      ? ok('HTTP 404. The server answers identically for “not yours” and “doesn’t exist”, so IDs can’t be probed.')
      : bad(err ? `Unexpected HTTP ${err.status}.` : 'The request unexpectedly succeeded.'),
  ];
}

export async function runAdminAccess(): Promise<LogLine[]> {
  const me = await api.me();
  const err = await expectFailure(() => api.adminOverview());
  if (me.role === 'ADMIN') {
    return [
      info('You are signed in as an admin.'),
      err ? bad(`The admin call failed: HTTP ${err.status}.`) : ok('The admin call succeeded, as it should for an admin. Sign in as a regular user to see it refused.'),
    ];
  }
  return [
    info('Called an admin-only endpoint as a regular user.'),
    err?.status === 403 ? ok('HTTP 403 Forbidden. Role checks are enforced on the server, not just hidden in the UI.') : bad(err ? `Unexpected HTTP ${err.status}.` : 'The call unexpectedly succeeded.'),
  ];
}

export const SCENARIOS: Scenario[] = [
  { id: 'replay', title: 'Retry after a dropped connection', proves: 'Idempotency: the same request sent twice moves money once.', addsMoney: true, run: runReplay },
  { id: 'key-reuse', title: 'Recycling a reference for a different payment', proves: 'A reference is bound to one exact request.', addsMoney: true, run: runKeyReuse },
  { id: 'parallel', title: 'Ten payments at the same instant', proves: 'Row locking: simultaneous updates to one wallet lose nothing.', addsMoney: true, run: runParallelDistinct },
  { id: 'parallel-same', title: 'Ten identical requests at the same instant', proves: 'Idempotency holds even when retries race each other.', addsMoney: true, run: runParallelSameKey },
  { id: 'insufficient', title: 'Spending more than you have', proves: 'Balance rules are enforced under the lock, and a refusal changes nothing.', addsMoney: false, run: runInsufficientFunds },
  { id: 'validation', title: 'Invalid amounts that bypass the UI', proves: 'The server validates every request itself.', addsMoney: false, run: runServerValidation },
  { id: 'not-yours', title: 'Reading a transaction that isn’t yours', proves: 'Ownership-scoped queries, and no ID enumeration.', addsMoney: false, run: runNotYours },
  { id: 'admin', title: 'Calling an admin endpoint', proves: 'Role-based access is enforced by the API.', addsMoney: false, run: runAdminAccess },
];
