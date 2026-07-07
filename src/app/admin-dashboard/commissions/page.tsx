import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminCommissionsClient from './components/AdminCommissionsClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Commissions | Admin',
};

export default async function CommissionsPage() {
  const commissions = await prisma.commissionSetting.findMany();

  // Serialize date and Decimal fields for Client Component compatibility
  const serializedCommissions = commissions.map((comm) => ({
    ...comm,
    percentage: comm.percentage ? Number(comm.percentage) : null,
    fixedAmount: comm.fixedAmount ? Number(comm.fixedAmount) : null,
    createdAt: comm.createdAt.toISOString(),
    updatedAt: comm.updatedAt.toISOString(),
  }));

  return <AdminCommissionsClient initialCommissions={serializedCommissions} />;
}

