import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminWelcomeClient from './components/AdminWelcomeClient';

export const metadata = {
  title: 'Welcome Messages | Admin',
};

export default async function WelcomeMessagesPage() {
  const messages = await prisma.welcomeMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Serialize date fields for Client Component compatibility
  const serializedMessages = messages.map((msg) => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString(),
  }));

  return <AdminWelcomeClient initialMessages={serializedMessages} />;
}

