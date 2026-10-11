import { request, requestText } from './client';
import type {
  AdminOverview, LedgerEntry, LoginResponse, Me, OutboxOverview, Page, PaymentBody, Reconciliation, TrialBalance,
  Transaction, Wallet, WalletAudit,
} from './types';

const post = <T,>(path: string, body: unknown, auth = true) => request<T>(path, { method: 'POST', body, auth });

export const api = {
  register: (b: { name: string; email: string; password: string }) => post<unknown>('/api/v1/users', b, false),
  login: (b: { email: string; password: string }) => post<LoginResponse>('/api/v1/auth/login', b, false),
  me: () => request<Me>('/api/v1/users/me'),
  wallet: () => request<Wallet>('/api/v1/wallets'),
  topUp: (b: PaymentBody) => post<Transaction>('/api/v1/wallets/top-up', b),
  transfer: (b: PaymentBody) => post<Transaction>('/api/v1/wallets/transfer', b),
  withdraw: (b: PaymentBody) => post<Transaction>('/api/v1/wallets/withdraw', b),
  transactions: (page: number, size = 10) =>
    request<Page<Transaction>>(`/api/v1/wallets/transactions?page=${page}&size=${size}`),
  ledger: (page: number, size = 10) => request<Page<LedgerEntry>>(`/api/v1/wallets/ledger?page=${page}&size=${size}`),
  entries: (transactionId: number) => request<LedgerEntry[]>(`/api/v1/wallets/transactions/${transactionId}/entries`),
  trialBalance: () => request<TrialBalance>('/api/v1/reconciliation/trial-balance'),
  reconcile: (walletId: number) => request<Reconciliation>(`/api/v1/reconciliation/wallet/${walletId}`),
  openingBalance: (walletId: number, b: { amount: number; referenceId: string }) =>
    post<void>(`/api/v1/reconciliation/wallet/${walletId}/opening-balance`, b),

  transaction: (id: number) => request<Transaction>(`/api/v1/wallets/transactions/${id}`),

  adminOverview: () => request<AdminOverview>('/api/v1/admin/overview'),
  adminWallets: (page: number, size = 15) => request<Page<WalletAudit>>(`/api/v1/admin/wallets?page=${page}&size=${size}`),
  adminTransactions: (page: number, size = 15) =>
    request<Page<Transaction>>(`/api/v1/admin/transactions?page=${page}&size=${size}`),
  adminEntries: (transactionId: number) =>
    request<LedgerEntry[]>(`/api/v1/admin/transactions/${transactionId}/entries`),
  adminOutbox: () => request<OutboxOverview>('/api/v1/admin/outbox'),

  health: () => request<{ status: string }>('/actuator/health', { auth: false }),
  metrics: () => requestText('/actuator/prometheus'),
};
