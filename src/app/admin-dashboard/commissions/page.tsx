import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminCommissionsClient from './components/AdminCommissionsClient';

export const metadata = {
  title: 'Commissions | Admin',
};

export default async function CommissionsPage() {
  const commissions = await prisma.commissionSetting.findMany();

  // Serialize date fields for Client Component compatibility
  const serializedCommissions = commissions.map((comm) => ({
    ...comm,
    createdAt: comm.createdAt.toISOString(),
    updatedAt: comm.updatedAt.toISOString(),
  }));

  return <AdminCommissionsClient initialCommissions={serializedCommissions} />;
}

