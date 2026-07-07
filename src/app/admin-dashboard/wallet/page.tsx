import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminWalletClient from './components/AdminWalletClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Wallet & Finance | Admin',
};

export default async function WalletPage() {
  const transactions = await prisma.walletTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Show top 100 transactions for audit
    include: {
      wallet: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  // Serialize dates for Client Component compatibility
  const serializedTransactions = transactions.map((tx) => ({
    ...tx,
    createdAt: tx.createdAt.toISOString(),
  }));

  return <AdminWalletClient initialTransactions={serializedTransactions as any} />;
}

