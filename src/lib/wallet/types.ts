export type TransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'REFERRAL_BONUS'
  | 'PAIRING_BONUS'
  | 'LEADERSHIP_BONUS'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT'
  | 'DEPOSIT'
  | 'FEE';

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';

export type CommissionType = 'REFERRAL_BONUS' | 'PAIRING_BONUS' | 'LEADERSHIP_BONUS';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  reference: string | null;
  metadata: string | null;
  status: TransactionStatus;
  createdAt: Date;
}

export interface CreateWalletInput {
  userId: string;
  initialBalance?: number;
}

export interface CreditDebitInput {
  walletId: string;
  amount: number;
  type: TransactionType;
  description: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface CommissionRecordInput {
  userId: string;
  amount: number;
  commissionType: CommissionType;
  description: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletBalance {
  walletId: string;
  userId: string;
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export interface TransactionFilters {
  walletId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedTransactions {
  transactions: WalletTransaction[];
  total: number;
  limit: number;
  offset: number;
}
