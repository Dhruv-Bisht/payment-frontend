// Mirrors the Spring Boot API's JSON. Money arrives as JSON numbers with two decimals.
export type Role = 'ADMIN' | 'USER';
export type TxType = 'TOP_UP' | 'TRANSFER' | 'WITHDRAWAL' | 'OPENING_BALANCE';
export type SystemAccount = 'EXTERNAL_CLEARING' | 'OPENING_EQUITY';

export interface LoginResponse {
  token: string;
  email: string;
}
export interface Me {
  id: number;
  name: string;
  email: string;
  role: Role;
  walletId: number;
}
export interface Wallet {
  walletId: number;
  userId: number;
  balance: number;
  currency: string;
  status: string;
}
export interface Transaction {
  transactionId: number;
  senderWalletId: number | null;
  receiverWalletId: number | null;
  amount: number;
  type: TxType;
  status: string;
  referenceId: string;
  created?: string;
  createdAt?: string;
}
export interface LedgerEntry {
  ledgerEntryId: number;
  transactionId: number;
  walletId: number | null;
  systemAccount: SystemAccount | null;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  createdAt: string;
}
export interface Page<T> {
  content: T[];
  totalPages?: number;
  page?: { totalPages: number };
}
export interface TrialBalance {
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
}
export interface Reconciliation {
  walletId: number;
  walletBalance: number;
  ledgerBalance: number;
  difference: number;
  consistent: boolean;
}
export interface PaymentBody {
  amount: number;
  referenceId: string;
  receiverWalletId?: number;
}

export const pageCount = (p?: Page<unknown>) => p?.totalPages ?? p?.page?.totalPages ?? 1;
export const txDate = (t: Transaction) => t.created ?? t.createdAt;

// ---- admin ----
export interface TypeStat {
  type: string;
  count: number;
  total: number;
}
export interface AdminOverview {
  users: number;
  wallets: number;
  transactions: number;
  ledgerEntries: number;
  moneyHeld: number;
  byType: TypeStat[];
  outboxPending: number;
  outboxPublished: number;
  eventPublisher: 'kafka' | 'log';
}
export interface WalletAudit {
  walletId: number;
  userId: number;
  ownerName: string;
  ownerEmail: string;
  balance: number;
  ledgerBalance: number;
  currency: string;
  status: string;
  consistent: boolean;
}
export interface OutboxEvent {
  id: number;
  eventId: string;
  eventType: string;
  aggregateId: string;
  status: 'PENDING' | 'PUBLISHED';
  attempts: number;
  createdAt: string;
  publishedAt: string | null;
  payload: string;
}
export interface OutboxOverview {
  pending: number;
  published: number;
  publisher: 'kafka' | 'log';
  recent: OutboxEvent[];
}
