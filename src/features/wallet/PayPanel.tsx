import { useMemo, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Button, Field } from '../../components/ui';
import { useToast } from '../../components/Toast';
import { createKeyRegistry } from '../../lib/idempotency';
import { money, shortKey } from '../../lib/format';
import type { Wallet } from '../../lib/types';
import { usePayment } from './usePayment';
import { validatePayment } from './validation';
import type { PayDraft, PayErrors, PayKind } from './validation';

const KINDS: { kind: PayKind; tab: string; verb: string; done: string }[] = [
  { kind: 'topup', tab: 'Add money', verb: 'Add', done: 'Money added.' },
  { kind: 'transfer', tab: 'Send', verb: 'Send', done: 'Payment sent.' },
  { kind: 'withdraw', tab: 'Withdraw', verb: 'Withdraw', done: 'Withdrawal completed.' },
];

interface Review {
  amount: number;
  receiverWalletId?: number;
  key: string;
}

export function PayPanel({ wallet }: { wallet?: Wallet }) {
  const [kind, setKind] = useState<PayKind>('topup');
  const [draft, setDraft] = useState<PayDraft>({ amount: '', receiver: '' });
  const [errors, setErrors] = useState<PayErrors>({});
  const [review, setReview] = useState<Review | null>(null);
  const registry = useMemo(() => createKeyRegistry(), []);
  const pay = usePayment();
  const toast = useToast();
  const current = KINDS.find((k) => k.kind === kind)!;

  function selectKind(next: PayKind) {
    setKind(next);
    setErrors({});
    setReview(null);
    pay.reset();
  }

  function onTabKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = KINDS.findIndex((k) => k.kind === kind);
    const next = KINDS[(i + (e.key === 'ArrowRight' ? 1 : KINDS.length - 1)) % KINDS.length];
    selectKind(next.kind);
    (e.currentTarget.querySelector(`#tab-${next.kind}`) as HTMLElement | null)?.focus();
  }

  function onReview(e: FormEvent) {
    e.preventDefault();
    const result = validatePayment(kind, draft, wallet);
    if (!result.ok) return setErrors(result.errors);
    setErrors({});
    // The key is bound to the exact request, so editing the amount or receiver issues a new one.
    const key = registry.keyFor(`${kind}|${result.receiverWalletId ?? ''}|${result.amount}`);
    setReview({ amount: result.amount, receiverWalletId: result.receiverWalletId, key });
  }

  function onConfirm() {
    if (!review) return;
    pay.mutate(
      { kind, amount: review.amount, receiverWalletId: review.receiverWalletId, referenceId: review.key },
      {
        onSuccess: (tx) => {
          registry.reset();
          setReview(null);
          setDraft({ amount: '', receiver: '' });
          toast('ok', `${current.done} Transaction #${tx.transactionId}.`);
        },
      }
    );
  }

  const balanceAfter = review && wallet ? wallet.balance + (kind === 'topup' ? review.amount : -review.amount) : null;

  return (
    <section className="pay" aria-label="Make a payment">
      <div className="tabs" role="tablist" aria-label="Payment type" onKeyDown={onTabKey}>
        {KINDS.map((k) => (
          <button
            key={k.kind}
            id={`tab-${k.kind}`}
            role="tab"
            aria-selected={kind === k.kind}
            tabIndex={kind === k.kind ? 0 : -1}
            className={kind === k.kind ? 'tab on' : 'tab'}
            onClick={() => selectKind(k.kind)}
          >
            {k.tab}
          </button>
        ))}
      </div>

      {!review ? (
        <form onSubmit={onReview} noValidate role="tabpanel" aria-labelledby={`tab-${kind}`}>
          {kind === 'transfer' && (
            <Field
              label="Receiver’s wallet ID"
              inputMode="numeric"
              value={draft.receiver}
              error={errors.receiver}
              onChange={(e) => setDraft((d) => ({ ...d, receiver: e.target.value }))}
            />
          )}
          <Field
            label="Amount in INR"
            inputMode="decimal"
            placeholder="0.00"
            value={draft.amount}
            error={errors.amount}
            hint={kind === 'topup' ? undefined : wallet ? `Available: ${money(wallet.balance)}` : undefined}
            onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
          />
          <Button type="submit" className="block" disabled={!wallet}>
            Review {current.verb.toLowerCase()}
          </Button>
        </form>
      ) : (
        <div className="review" role="tabpanel" aria-labelledby={`tab-${kind}`}>
          <h3>Check the details</h3>
          <dl className="facts">
            <dt>Amount</dt>
            <dd>{money(review.amount)}</dd>
            {review.receiverWalletId !== undefined && (
              <>
                <dt>To wallet</dt>
                <dd>{review.receiverWalletId}</dd>
              </>
            )}
            {balanceAfter !== null && (
              <>
                <dt>Balance after</dt>
                <dd>{money(balanceAfter)}</dd>
              </>
            )}
            <dt>Reference</dt>
            <dd title={review.key}>{shortKey(review.key)}</dd>
          </dl>
          <p className="muted small">
            If the connection drops, retrying uses the same reference, so this payment is applied only once.
          </p>

          {pay.isPending && pay.failureCount > 0 && (
            <p className="notice" role="status">
              Connection problem. Retrying safely (attempt {pay.failureCount + 1})…
            </p>
          )}
          {pay.isError && (
            <p className="notice bad" role="alert">
              {pay.error.message} You can confirm again; the same reference is reused.
            </p>
          )}

          <div className="actions">
            <Button variant="secondary" onClick={() => setReview(null)} disabled={pay.isPending}>
              Edit
            </Button>
            <Button onClick={onConfirm} loading={pay.isPending}>
              Confirm {current.verb.toLowerCase()}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
