import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: api.me, staleTime: Infinity });

export const useWallet = () => useQuery({ queryKey: ['wallet'], queryFn: api.wallet });

export const useTransactions = (page: number, size = 10) =>
  useQuery({
    queryKey: ['transactions', page, size],
    queryFn: () => api.transactions(page, size),
    placeholderData: keepPreviousData,
  });

/** One transaction by id. The server answers 404 for anything that isn't yours. */
export const useTransaction = (id: number | null) =>
  useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.transaction(id as number),
    enabled: id !== null,
    retry: false,
  });

export const useLedger = (page: number, size = 10) =>
  useQuery({
    queryKey: ['ledger', page, size],
    queryFn: () => api.ledger(page, size),
    placeholderData: keepPreviousData,
  });

/** A transaction's journal entry never changes once written, so it can be cached forever. */
export const useEntries = (transactionId: number | null, scope: 'me' | 'admin' = 'me') =>
  useQuery({
    queryKey: ['entries', scope, transactionId],
    queryFn: () => (scope === 'admin' ? api.adminEntries(transactionId as number) : api.entries(transactionId as number)),
    enabled: transactionId !== null,
    staleTime: Infinity,
    retry: false,
  });
