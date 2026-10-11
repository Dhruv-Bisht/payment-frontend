import { money } from '../../lib/format';

export type PayKind = 'topup' | 'transfer' | 'withdraw';
export interface PayDraft {
  amount: string;
  receiver: string;
}
export interface PayErrors {
  amount?: string;
  receiver?: string;
}
export type Validated = { ok: true; amount: number; receiverWalletId?: number } | { ok: false; errors: PayErrors };

// Mirrors the server: at most 2 decimals, 1.00 to 1,000,000.00 per payment.
const AMOUNT = /^\d{1,7}(\.\d{1,2})?$/;
const MIN = 1;
const MAX = 1_000_000;

export function validatePayment(
  kind: PayKind,
  draft: PayDraft,
  wallet?: { walletId: number; balance: number } | null
): Validated {
  const errors: PayErrors = {};

  const raw = draft.amount.trim();
  let amount = NaN;
  if (!AMOUNT.test(raw)) {
    errors.amount = 'Enter an amount with at most 2 decimal places.';
  } else {
    amount = Number(raw);
    if (amount < MIN) errors.amount = `The minimum amount is ${money(MIN)}.`;
    else if (amount > MAX) errors.amount = `The maximum per payment is ${money(MAX)}.`;
    else if (kind !== 'topup' && wallet && amount > wallet.balance) errors.amount = 'That is more than your balance.';
  }

  let receiverWalletId: number | undefined;
  if (kind === 'transfer') {
    const text = draft.receiver.trim();
    const id = Number(text);
    if (!text || !Number.isInteger(id) || id <= 0) errors.receiver = 'Enter the receiver’s wallet ID (a whole number).';
    else if (wallet && id === wallet.walletId) errors.receiver = 'You can’t send money to your own wallet.';
    else receiverWalletId = id;
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, amount, receiverWalletId };
}
