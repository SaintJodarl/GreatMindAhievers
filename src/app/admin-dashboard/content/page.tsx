import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminContentClient from './components/AdminContentClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Content Management | Admin',
};

export default async function ContentPage() {
  const contents = await prisma.content.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Convert Date objects to strings for Client Component compatibility
  const serializedContents = contents.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return <AdminContentClient initialContents={serializedContents} />;
}

