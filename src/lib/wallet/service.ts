import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  Wallet,
  WalletTransaction,
  CreateWalletInput,
  CreditDebitInput,
  CommissionRecordInput,
  WalletBalance,
  TransactionFilters,
  PaginatedTransactions,
  TransactionType,
  TransactionStatus,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export type { TransactionFilters, TransactionType, TransactionStatus, WalletTransaction };

function castTransaction(t: any): WalletTransaction {
  if (!t) return t;
  return {
    ...t,
    type: t.type as TransactionType,
    status: t.status as TransactionStatus,
  };
}

const CREDIT_TYPES: TransactionType[] = [
  'CREDIT',
  'REFERRAL_BONUS',
  'PAIRING_BONUS',
  'LEADERSHIP_BONUS',
  'DEPOSIT',
  'ADJUSTMENT',
];
const DEBIT_TYPES: TransactionType[] = ['DEBIT', 'WITHDRAWAL', 'FEE'];

function generateReference(): string {
  return `txn_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

function isCreditType(type: TransactionType): boolean {
  return CREDIT_TYPES.includes(type);
}

function isDebitType(type: TransactionType): boolean {
  return DEBIT_TYPES.includes(type);
}

export async function getOrCreateWallet(userId: string): Promise<Wallet> {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        id: userId,
        userId,
        balance: 0,
      },
    });
  }

  return wallet;
}

export async function getWalletByUserId(userId: string): Promise<Wallet | null> {
  return prisma.wallet.findUnique({
    where: { userId },
  });
}

export async function getWalletById(walletId: string): Promise<Wallet | null> {
  return prisma.wallet.findUnique({
    where: { id: walletId },
  });
}

export async function getWalletBalance(walletId: string): Promise<WalletBalance | null> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { id: true, userId: true, balance: true, updatedAt: true },
  });

  if (!wallet) return null;

  return {
    walletId: wallet.id,
    userId: wallet.userId,
    balance: wallet.balance,
    currency: 'NGN',
    lastUpdated: wallet.updatedAt,
  };
}

export async function creditWallet(
  tx: Prisma.TransactionClient,
  input: CreditDebitInput
): Promise<WalletTransaction> {
  const { walletId, amount, type, description, reference, metadata } = input;

  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (!isCreditType(type)) {
    throw new Error(`Transaction type ${type} is not a credit type`);
  }

  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const newBalance = wallet.balance + amount;
  const txnReference = reference ?? generateReference();

  const transaction = await tx.walletTransaction.create({
    data: {
      walletId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      reference: txnReference,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'COMPLETED',
    },
  });

  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance },
  });

  return castTransaction(transaction);
}

export async function debitWallet(
  tx: Prisma.TransactionClient,
  input: CreditDebitInput
): Promise<WalletTransaction> {
  const { walletId, amount, type, description, reference, metadata } = input;

  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (!isDebitType(type)) {
    throw new Error(`Transaction type ${type} is not a debit type`);
  }

  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const newBalance = wallet.balance - amount;
  const txnReference = reference ?? generateReference();

  const transaction = await tx.walletTransaction.create({
    data: {
      walletId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      reference: txnReference,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'COMPLETED',
    },
  });

  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance },
  });

  return castTransaction(transaction);
}

export async function recordCommission(
  tx: Prisma.TransactionClient,
  input: CommissionRecordInput
): Promise<WalletTransaction> {
  const { userId, amount, commissionType, description, reference, metadata } = input;

  if (amount <= 0) {
    throw new Error('Commission amount must be greater than zero');
  }

  let wallet = await tx.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await tx.wallet.create({
      data: { id: userId, userId, balance: 0 },
    });
  }

  return creditWallet(tx, {
    walletId: wallet.id,
    amount,
    type: commissionType,
    description,
    reference,
    metadata,
  });
}

export async function adjustBalance(
  tx: Prisma.TransactionClient,
  walletId: string,
  newBalance: number,
  description: string,
  reference?: string,
  metadata?: Record<string, unknown>
): Promise<WalletTransaction> {
  if (newBalance < 0) {
    throw new Error('Balance cannot be negative');
  }

  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const difference = newBalance - wallet.balance;
  const type = difference >= 0 ? 'ADJUSTMENT' : 'ADJUSTMENT';
  const txnReference = reference ?? generateReference();

  const transaction = await tx.walletTransaction.create({
    data: {
      walletId,
      type,
      amount: Math.abs(difference),
      balanceAfter: newBalance,
      description,
      reference: txnReference,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'COMPLETED',
    },
  });

  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance },
  });

  return castTransaction(transaction);
}

export async function getTransactions(
  filters: TransactionFilters = {}
): Promise<PaginatedTransactions> {
  const { walletId, type, status, startDate, endDate, limit = 50, offset = 0 } = filters;

  const where: Prisma.WalletTransactionWhereInput = {};

  if (walletId) where.walletId = walletId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    transactions: transactions.map(castTransaction),
    total,
    limit,
    offset,
  };
}

export async function getTransactionById(id: string): Promise<WalletTransaction | null> {
  const txn = await prisma.walletTransaction.findUnique({
    where: { id },
  });
  return castTransaction(txn);
}

export async function getTransactionByReference(
  reference: string
): Promise<WalletTransaction | null> {
  const txn = await prisma.walletTransaction.findUnique({
    where: { reference },
  });
  return castTransaction(txn);
}

export async function reverseTransaction(
  tx: Prisma.TransactionClient,
  transactionId: string,
  reason: string
): Promise<WalletTransaction> {
  const originalTxn = await tx.walletTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!originalTxn) {
    throw new Error('Transaction not found');
  }

  if (originalTxn.status === 'REVERSED') {
    throw new Error('Transaction already reversed');
  }

  if (originalTxn.status !== 'COMPLETED') {
    throw new Error('Can only reverse completed transactions');
  }

  const wallet = await tx.wallet.findUnique({
    where: { id: originalTxn.walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const isOriginalCredit = isCreditType(originalTxn.type as TransactionType);
  const reverseAmount = originalTxn.amount;
  const newBalance = isOriginalCredit
    ? wallet.balance - reverseAmount
    : wallet.balance + reverseAmount;

  if (newBalance < 0) {
    throw new Error('Reversal would result in negative balance');
  }

  const reverseReference = `rev_${originalTxn.reference ?? originalTxn.id}`;
  const reverseType = isOriginalCredit ? 'DEBIT' : 'CREDIT';

  const reverseTxn = await tx.walletTransaction.create({
    data: {
      walletId: originalTxn.walletId,
      type: reverseType,
      amount: reverseAmount,
      balanceAfter: newBalance,
      description: `Reversal: ${reason} (Original: ${originalTxn.description})`,
      reference: reverseReference,
      metadata: JSON.stringify({ originalTransactionId: originalTxn.id }),
      status: 'COMPLETED',
    },
  });

  await tx.wallet.update({
    where: { id: originalTxn.walletId },
    data: { balance: newBalance },
  });

  await tx.walletTransaction.update({
    where: { id: transactionId },
    data: { status: 'REVERSED' },
  });

  return castTransaction(reverseTxn);
}

export async function calculateBalance(walletId: string): Promise<number> {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { balance: true },
  });

  return wallet?.balance ?? 0;
}

export async function recalculateBalanceFromTransactions(walletId: string): Promise<number> {
  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId, status: 'COMPLETED' },
    orderBy: { createdAt: 'asc' },
    select: { type: true, amount: true },
  });

  let balance = 0;

  for (const txn of transactions) {
    if (isCreditType(txn.type as TransactionType)) {
      balance += txn.amount;
    } else if (isDebitType(txn.type as TransactionType)) {
      balance -= txn.amount;
    }
  }

  await prisma.wallet.update({
    where: { id: walletId },
    data: { balance },
  });

  return balance;
}
