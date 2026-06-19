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

  const txnReference = reference ?? generateReference();

  // 1. Idempotency Check: check FinancialEvent first
  const existingEvent = await tx.financialEvent.findUnique({
    where: { eventId: txnReference },
  });
  if (existingEvent) {
    console.log(`[Idempotency Gate] FinancialEvent with eventId ${txnReference} already exists. Skipping.`);
    const existingTxn = await tx.walletTransaction.findUnique({
      where: { reference: txnReference },
    });
    if (existingTxn) {
      return castTransaction(existingTxn);
    }
    throw new Error(`FinancialEvent ${txnReference} exists but no matching WalletTransaction found.`);
  }

  // Also check WalletTransaction directly to be absolutely sure
  const existingTxn = await tx.walletTransaction.findUnique({
    where: { reference: txnReference },
  });
  if (existingTxn) {
    console.log(`[Idempotency Gate] Transaction with reference ${txnReference} already exists. Skipping.`);
    return castTransaction(existingTxn);
  }

  // Get wallet user ID
  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // 2. Create FinancialEvent
  await tx.financialEvent.create({
    data: {
      eventId: txnReference,
      userId: wallet.userId,
      type,
      amount,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // 3. Atomic Balance Increment
  const updatedWallet = await tx.wallet.update({
    where: { id: walletId },
    data: { balance: { increment: amount } },
  });

  const newBalance = updatedWallet.balance;

  // 4. Create Transaction Ledger Record
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId,
      userId: wallet.userId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      reference: txnReference,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'COMPLETED',
    },
  });

  // 5. Audit Drift Detection
  await verifyWalletIntegrity(tx, walletId);

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

  const txnReference = reference ?? generateReference();

  // 1. Idempotency Check: check FinancialEvent first
  const existingEvent = await tx.financialEvent.findUnique({
    where: { eventId: txnReference },
  });
  if (existingEvent) {
    console.log(`[Idempotency Gate] FinancialEvent with eventId ${txnReference} already exists. Skipping.`);
    const existingTxn = await tx.walletTransaction.findUnique({
      where: { reference: txnReference },
    });
    if (existingTxn) {
      return castTransaction(existingTxn);
    }
    throw new Error(`FinancialEvent ${txnReference} exists but no matching WalletTransaction found.`);
  }

  // Also check WalletTransaction directly
  const existingTxn = await tx.walletTransaction.findUnique({
    where: { reference: txnReference },
  });
  if (existingTxn) {
    console.log(`[Idempotency Gate] Transaction with reference ${txnReference} already exists. Skipping.`);
    return castTransaction(existingTxn);
  }

  // Get wallet user ID
  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  // Check balance before debit
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  // 2. Create FinancialEvent
  await tx.financialEvent.create({
    data: {
      eventId: txnReference,
      userId: wallet.userId,
      type,
      amount,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // 3. Atomic Balance Decrement and Constraint Check
  const updatedWallet = await tx.wallet.update({
    where: { id: walletId },
    data: { balance: { decrement: amount } },
  });

  // Double check balance under concurrency
  if (updatedWallet.balance < 0) {
    throw new Error('Insufficient balance');
  }

  const newBalance = updatedWallet.balance;

  // 4. Create Transaction Ledger Record
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId,
      userId: wallet.userId,
      type,
      amount,
      balanceAfter: newBalance,
      description,
      reference: txnReference,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'COMPLETED',
    },
  });

  // 5. Audit Drift Detection
  await verifyWalletIntegrity(tx, walletId);

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

  // Idempotency precheck to avoid creating wallet or query overhead if already processed
  if (reference) {
    const existingEvent = await tx.financialEvent.findUnique({
      where: { eventId: reference },
    });
    if (existingEvent) {
      console.log(`[Idempotency Gate] FinancialEvent with eventId ${reference} already exists. Skipping.`);
      const existingTxn = await tx.walletTransaction.findUnique({
        where: { reference },
      });
      if (existingTxn) return castTransaction(existingTxn);
      throw new Error(`FinancialEvent ${reference} exists but no matching WalletTransaction found.`);
    }

    const existingTxn = await tx.walletTransaction.findUnique({
      where: { reference },
    });
    if (existingTxn) {
      console.log(`[Idempotency Check] Commission with reference ${reference} already exists. Skipping.`);
      return castTransaction(existingTxn);
    }
  }

  // Self-referral abuse prevention check: payee userId cannot earn commission from their own purchase
  if (metadata && typeof metadata === 'object') {
    const buyerId = (metadata as any).buyerId;
    if (buyerId && buyerId === userId) {
      throw new Error('Self-referral commission payout is forbidden');
    }
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

  const txnReference = reference ?? generateReference();

  // 1. Idempotency Check
  const existingEvent = await tx.financialEvent.findUnique({
    where: { eventId: txnReference },
  });
  if (existingEvent) {
    console.log(`[Idempotency Gate] FinancialEvent with eventId ${txnReference} already exists. Skipping.`);
    const existingTxn = await tx.walletTransaction.findUnique({
      where: { reference: txnReference },
    });
    if (existingTxn) {
      return castTransaction(existingTxn);
    }
    throw new Error(`FinancialEvent ${txnReference} exists but no matching WalletTransaction found.`);
  }

  const existingTxn = await tx.walletTransaction.findUnique({
    where: { reference: txnReference },
  });
  if (existingTxn) {
    console.log(`[Idempotency Gate] Adjustment with reference ${txnReference} already exists. Skipping.`);
    return castTransaction(existingTxn);
  }

  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const difference = newBalance - wallet.balance;
  const type = 'ADJUSTMENT';

  // 2. Create FinancialEvent
  await tx.financialEvent.create({
    data: {
      eventId: txnReference,
      userId: wallet.userId,
      type,
      amount: Math.abs(difference),
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // 3. Create Transaction Ledger Record
  const transaction = await tx.walletTransaction.create({
    data: {
      walletId,
      userId: wallet.userId,
      type,
      amount: Math.abs(difference),
      balanceAfter: newBalance,
      description,
      reference: txnReference,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'COMPLETED',
    },
  });

  // 4. Update Wallet balance
  await tx.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance },
  });

  // 5. Verify integrity
  await verifyWalletIntegrity(tx, walletId);

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
  
  // Use atomic updates for balance reversal
  let updatedWallet;
  if (isOriginalCredit) {
    updatedWallet = await tx.wallet.update({
      where: { id: originalTxn.walletId },
      data: { balance: { decrement: reverseAmount } },
    });
    if (updatedWallet.balance < 0) {
      throw new Error('Reversal would result in negative balance');
    }
  } else {
    updatedWallet = await tx.wallet.update({
      where: { id: originalTxn.walletId },
      data: { balance: { increment: reverseAmount } },
    });
  }

  const newBalance = updatedWallet.balance;
  const reverseReference = `rev_${originalTxn.reference ?? originalTxn.id}`;
  const reverseType = isOriginalCredit ? 'DEBIT' : 'CREDIT';

  const reverseTxn = await tx.walletTransaction.create({
    data: {
      walletId: originalTxn.walletId,
      userId: originalTxn.userId,
      type: reverseType,
      amount: reverseAmount,
      balanceAfter: newBalance,
      description: `Reversal: ${reason} (Original: ${originalTxn.description})`,
      reference: reverseReference,
      metadata: JSON.stringify({ originalTransactionId: originalTxn.id }),
      status: 'COMPLETED',
    },
  });

  await tx.walletTransaction.update({
    where: { id: transactionId },
    data: { status: 'REVERSED' },
  });

  // Verify integrity
  await verifyWalletIntegrity(tx, originalTxn.walletId);

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

export async function verifyWalletIntegrity(
  tx: Prisma.TransactionClient,
  walletId: string
): Promise<{ isConsistent: boolean; drift: number; walletBalance: number; ledgerSum: number }> {
  const wallet = await tx.wallet.findUnique({
    where: { id: walletId },
  });

  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const transactions = await tx.walletTransaction.findMany({
    where: { walletId, status: 'COMPLETED' },
  });

  let ledgerSum = 0;
  for (const txn of transactions) {
    if (isCreditType(txn.type as TransactionType)) {
      ledgerSum += txn.amount;
    } else if (isDebitType(txn.type as TransactionType)) {
      ledgerSum -= txn.amount;
    }
  }

  const drift = Math.abs(wallet.balance - ledgerSum);
  const isConsistent = drift < 0.001;

  if (!isConsistent) {
    console.error(
      `[CRITICAL AUDIT DRIFT DETECTED] Wallet ID: ${walletId} for User: ${wallet.userId} is inconsistent! Wallet balance cached: ${wallet.balance}, Ledger sum total: ${ledgerSum}, Drift difference: ${drift}`
    );
  }

  return {
    isConsistent,
    drift,
    walletBalance: wallet.balance,
    ledgerSum,
  };
}

export async function distributeMultiLevelCommission(
  tx: Prisma.TransactionClient,
  input: {
    buyerId: string;
    amountPerLevel: number[];
    orderId: string;
    description: string;
  }
): Promise<WalletTransaction[]> {
  const { buyerId, amountPerLevel, orderId, description } = input;
  const transactions: WalletTransaction[] = [];
  const maxLevels = amountPerLevel.length;

  // 1. Fetch buyer's path to resolve uplines without recursive database queries
  const buyer = await tx.user.findUnique({
    where: { id: buyerId },
    select: { path: true, depth: true },
  });

  if (!buyer || !buyer.path) {
    console.warn(`[Upline Resolution] Buyer ${buyerId} has no materialized path.`);
    return [];
  }

  // 2. Parse upline sponsor chain from path
  const pathParts = buyer.path.split('/');
  // Filter out the 'root' constant and the buyer themselves
  const uplineIds = pathParts.filter((id) => id !== 'root' && id !== buyerId);

  // Circular referral loop verification: user cannot appear in their own path chain (except as buyerId, which we filtered out)
  const uniqueUplines = new Set(uplineIds);
  if (uniqueUplines.size !== uplineIds.length) {
    console.warn(`[MLM LOOP GUARD] Circular loop detected in buyer ${buyerId} path: ${buyer.path}! Payout stopped.`);
    return [];
  }

  // 3. Batch fetch upline users to check their existence and data integrity
  // Note: the order of uplineIds from left to right is top-to-bottom:
  // e.g. root -> Level 3 -> Level 2 -> Level 1 (Immediate sponsor)
  // We want to slice from the end to match levels (Level 1 is candidateIds[candidateIds.length - 1])
  const uplines = await tx.user.findMany({
    where: {
      id: { in: uplineIds },
    },
    select: {
      id: true,
      sponsorId: true,
    },
  });

  const uplineMap = new Map(uplines.map((u) => [u.id, u]));

  // Traverse the levels: Level 1 is the immediate sponsor, Level 2 is the sponsor's sponsor, etc.
  for (let level = 1; level <= maxLevels; level++) {
    // Immediate sponsor is at the end of the upline array
    const sponsorId = uplineIds[uplineIds.length - level];
    if (!sponsorId) {
      break;
    }

    // Verify user exists in the database
    const sponsor = uplineMap.get(sponsorId);
    if (!sponsor) {
      console.warn(`[Upline Resolution] Sponsor ${sponsorId} at level ${level} not found in database.`);
      break;
    }

    // Self-commission prevention: sponsor cannot be the buyer themselves
    if (sponsorId === buyerId) {
      console.warn(`[Self-Referral Guard] Sponsor ${sponsorId} is the same as buyer ${buyerId}. Skipping level ${level} payout.`);
      continue;
    }

    const amount = amountPerLevel[level - 1];
    if (amount > 0) {
      // Deterministic eventId per level to guarantee idempotency per level
      // eventId format: ref:orderId:userId:level1
      const eventId = `ref:${orderId}:${buyerId}:level${level}`;

      const txn = await recordCommission(tx, {
        userId: sponsorId,
        amount,
        commissionType: 'REFERRAL_BONUS',
        description: `${description} (Level ${level} Referral Bonus from User ${buyerId})`,
        reference: eventId,
        metadata: { buyerId, level }, // pass buyerId to bypass self-referral check
      });

      // Write to explicit CommissionLog table
      await tx.commissionLog.create({
        data: {
          userId: sponsorId,
          fromUserId: buyerId,
          level,
          amount,
          status: 'COMPLETED'
        }
      });

      transactions.push(txn);
    }
  }

  return transactions;
}
