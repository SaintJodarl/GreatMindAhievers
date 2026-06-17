import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';


import { redirect } from 'next/navigation';
import ReferralHistoryTable from './ReferralHistoryTable';

export const metadata = {
  title: 'Invitation History | GMA Network',
};

export default async function ReferralHistoryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/sign-up-login-screen');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Invitation History</h1>
        <p className="text-gray-500 mt-1">Track the status of your sent invitations.</p>
      </div>

      <ReferralHistoryTable />
    </div>
  );
}
