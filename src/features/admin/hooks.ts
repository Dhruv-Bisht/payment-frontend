import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { parsePrometheus } from '../../lib/prometheus';

export const useAdminOverview = () =>
  useQuery({ queryKey: ['admin', 'overview'], queryFn: api.adminOverview, refetchInterval: 15_000 });

export const useTrialBalance = () =>
  useQuery({ queryKey: ['admin', 'trial-balance'], queryFn: api.trialBalance, refetchInterval: 30_000 });

export const useAdminWallets = (page: number, size = 15) =>
  useQuery({
    queryKey: ['admin', 'wallets', page, size],
    queryFn: () => api.adminWallets(page, size),
    placeholderData: keepPreviousData,
  });

export const useAdminTransactions = (page: number, size = 15) =>
  useQuery({
    queryKey: ['admin', 'transactions', page, size],
    queryFn: () => api.adminTransactions(page, size),
    placeholderData: keepPreviousData,
  });

export const useAdminOutbox = () =>
  useQuery({ queryKey: ['admin', 'outbox'], queryFn: api.adminOutbox, refetchInterval: 5_000 });

export const useMetrics = () =>
  useQuery({
    queryKey: ['admin', 'metrics'],
    queryFn: async () => parsePrometheus(await api.metrics()),
    refetchInterval: 5_000,
    retry: false,
  });
