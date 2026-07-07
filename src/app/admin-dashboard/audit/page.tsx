import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminAuditClient from './components/AdminAuditClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Audit Logs | Admin',
};

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100, // Show top 100 logs
  });

  // Serialize dates for Client Component compatibility
  const serializedLogs = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return <AdminAuditClient initialLogs={serializedLogs} />;
}

