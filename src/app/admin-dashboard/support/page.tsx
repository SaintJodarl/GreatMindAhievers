import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminSupportClient from './components/AdminSupportClient';

export const metadata = {
  title: 'Support Management | Admin',
};

export default async function SupportPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { messages: true },
      },
    },
  });

  // Serialize dates for Client Component compatibility
  const serializedTickets = tickets.map((ticket) => ({
    ...ticket,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  }));

  return <AdminSupportClient initialTickets={serializedTickets} />;
}

