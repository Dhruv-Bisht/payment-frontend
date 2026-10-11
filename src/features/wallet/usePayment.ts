import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { isRetrySafe } from '../../lib/client';
import type { ApiError } from '../../lib/client';
import type { PaymentBody, Transaction, Wallet } from '../../lib/types';
import type { PayKind } from './validation';

export interface PaymentInput {
  kind: PayKind;
  amount: number;
  receiverWalletId?: number;
  referenceId: string; // the idempotency key
}

export function usePayment() {
  const queryClient = useQueryClient();

  return useMutation<Transaction, ApiError, PaymentInput, { previous?: Wallet }>({
    mutationFn: ({ kind, amount, receiverWalletId, referenceId }) => {
      const body: PaymentBody = { amount, referenceId };
      if (receiverWalletId !== undefined) body.receiverWalletId = receiverWalletId;
      if (kind === 'topup') return api.topUp(body);
      return kind === 'transfer' ? api.transfer(body) : api.withdraw(body);
    },

    // Automatic retry is only safe because the same referenceId is resent (see isRetrySafe).
    retry: (failureCount, error) => failureCount < 2 && isRetrySafe(error),
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),

    // Optimistic update: money leaving the wallet shows immediately and is rolled back on failure.
    onMutate: async ({ kind, amount }) => {
      if (kind === 'topup') return {};
      await queryClient.cancelQueries({ queryKey: ['wallet'] });
      const previous = queryClient.getQueryData<Wallet>(['wallet']);
      if (previous) queryClient.setQueryData<Wallet>(['wallet'], { ...previous, balance: previous.balance - amount });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['wallet'], context.previous);
    },
    // Whatever happened, the server is the source of truth.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    },
  });
}
