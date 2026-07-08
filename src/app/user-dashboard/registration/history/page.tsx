import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';

import { redirect } from 'next/navigation';
import RegistrationHistoryTable from './RegistrationHistoryTable';

export const metadata = {
  title: 'Registration History | GMA Network',
};

export default async function RegistrationHistoryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/sign-up-login-screen');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Registration History</h1>
        <p className="text-gray-500 mt-1">View history of members you manually registered.</p>
      </div>

      <RegistrationHistoryTable />
    </div>
  );
}
