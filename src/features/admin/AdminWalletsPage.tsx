import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, ErrorNotice, Field, Pager, Skeleton } from '../../components/ui';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { api } from '../../lib/api';
import { money } from '../../lib/format';
import { newKey } from '../../lib/idempotency';
import { pageCount } from '../../lib/types';
import type { WalletAudit } from '../../lib/types';
import { useAdminWallets } from './hooks';

const AMOUNT = /^\d{1,7}(\.\d{1,2})?$/;

function WalletSheet({ walletId, row, onClose }: { walletId: number; row?: WalletAudit; onClose: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const rec = useQuery({ queryKey: ['reconcile', walletId], queryFn: () => api.reconcile(walletId), retry: false });
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState(() => newKey());
  const [confirmed, setConfirmed] = useState(false);
  const [formError, setFormError] = useState('');

  const backfill = useMutation({
    mutationFn: () => api.openingBalance(walletId, { amount: Number(amount), referenceId: reference }),
    onSuccess: () => {
      toast('ok', `Opening balance of ${money(Number(amount))} posted to the ledger of wallet ${walletId}.`);
      setAmount('');
      setConfirmed(false);
      setReference(newKey());
      queryClient.invalidateQueries({ queryKey: ['reconcile'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!AMOUNT.test(amount.trim()) || Number(amount) < 0.01) return setFormError('Enter an amount of at least 0.01, with at most 2 decimal places.');
    if (!confirmed) return setFormError('Tick the box to confirm you understand what this does.');
    setFormError('');
    backfill.mutate();
  }

  const diff = rec.data?.difference ?? 0;

  return (
    <Sheet open onClose={onClose} title={`Wallet ${walletId}`}>
      {row && (
        <p className="muted small">
          {row.ownerName} ({row.ownerEmail}), {row.currency}, {row.status.toLowerCase()}
        </p>
      )}
      {rec.isPending && <Skeleton height={100} />}
      {rec.isError && <ErrorNotice error={rec.error} onRetry={() => rec.refetch()} />}
      {rec.data && (
        <dl className="facts">
          <dt>Stored balance</dt>
          <dd>{money(rec.data.walletBalance)}</dd>
          <dt>Ledger balance</dt>
          <dd>{money(rec.data.ledgerBalance)}</dd>
          <dt>Difference</dt>
          <dd>{money(rec.data.difference)}</dd>
          <dt>Result</dt>
          <dd>{rec.data.consistent ? <Badge tone="ok">Consistent</Badge> : <Badge tone="bad">Mismatch</Badge>}</dd>
        </dl>
      )}

      <details className="advanced">
        <summary>Advanced: backfill an opening balance</summary>
        <p className="muted small">
          Posts ledger entries (debit Opening equity, credit this wallet) so the ledger catches up with a balance that
          already exists, for example from before the ledger was introduced. It does <strong>not</strong> change the
          wallet’s balance. To add money, use a top-up.
        </p>
        <form onSubmit={submit} noValidate>
          <Field
            label="Amount in INR"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={diff > 0 ? `The ledger is short by ${money(diff)}.` : undefined}
          />
          {diff > 0 && (
            <button type="button" className="link" onClick={() => setAmount(diff.toFixed(2))}>
              Use the difference
            </button>
          )}
          <Field label="Reference (idempotency key)" value={reference} onChange={(e) => setReference(e.target.value)} />
          <label className="check-line">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I understand this only aligns the ledger and does not move money.
          </label>
          <Button type="submit" loading={backfill.isPending}>Post opening balance</Button>
          {formError && <p className="notice bad" role="alert">{formError}</p>}
          {backfill.isError && <p className="notice bad" role="alert">{backfill.error.message}</p>}
        </form>
      </details>
    </Sheet>
  );
}

export default function AdminWalletsPage() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<{ id: number; row?: WalletAudit } | null>(null);
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const wallets = useAdminWallets(page, 15);

  function go(e: FormEvent) {
    e.preventDefault();
    const id = Number(lookup.trim());
    if (!Number.isInteger(id) || id <= 0) return setLookupError('Enter a wallet ID (a whole number).');
    setLookupError('');
    setSelected({ id, row: wallets.data?.content.find((w) => w.walletId === id) });
  }

  return (
    <>
      <p className="muted lede">
        Every wallet’s stored balance next to the balance implied by its ledger. Select a wallet to reconcile it in
        detail.
      </p>

      <form className="inline-form" onSubmit={go} noValidate>
        <Field label="Look up a wallet by ID" inputMode="numeric" value={lookup} error={lookupError} onChange={(e) => setLookup(e.target.value)} />
        <Button type="submit" variant="secondary">Open wallet</Button>
      </form>

      {wallets.isPending && <Skeleton height={240} />}
      {wallets.isError && <ErrorNotice error={wallets.error} onRetry={() => wallets.refetch()} />}
      {wallets.data && (
        <>
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th scope="col">Wallet</th>
                  <th scope="col">Owner</th>
                  <th scope="col" className="num">Stored balance</th>
                  <th scope="col" className="num">Ledger balance</th>
                  <th scope="col">Result</th>
                </tr>
              </thead>
              <tbody>
                {wallets.data.content.map((w) => (
                  <tr key={w.walletId}>
                    <td>
                      <button className="row-link" onClick={() => setSelected({ id: w.walletId, row: w })}>
                        #{w.walletId}
                      </button>
                    </td>
                    <td>{w.ownerName} <span className="muted small">{w.ownerEmail}</span></td>
                    <td className="num">{money(w.balance)}</td>
                    <td className="num">{money(w.ledgerBalance)}</td>
                    <td>{w.consistent ? <Badge tone="ok">Consistent</Badge> : <Badge tone="bad">Mismatch</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={page} pages={pageCount(wallets.data)} onPage={setPage} />
        </>
      )}

      {selected && <WalletSheet key={selected.id} walletId={selected.id} row={selected.row} onClose={() => setSelected(null)} />}
    </>
  );
}
