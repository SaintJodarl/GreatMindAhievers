import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminWithdrawalsClient from './components/AdminWithdrawalsClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Withdrawals | Admin',
};

export default async function WithdrawalsPage() {
  const withdrawals = await prisma.withdrawal.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          kycStatus: true,
        },
      },
    },
  });

  // Serialize date fields for Client Component compatibility
  const serializedWithdrawals = withdrawals.map((w) => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
    processedAt: w.processedAt ? w.processedAt.toISOString() : null,
  }));

  return <AdminWithdrawalsClient initialWithdrawals={serializedWithdrawals as any} />;
}

