import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import RegistrationNewForm from './RegistrationNewForm';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Register New Member | GMA Network',
};

export default async function RegisterNewPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/sign-up-login-screen');
  }

  const userId = currentUser.id;

  // Retrieve current user's referral code to pre-fill the sponsor field
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  const sponsorCode = user?.referralCode || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Register New Member</h1>
        <p className="text-gray-500 mt-1">Directly register a new member into the network.</p>
      </div>

      <RegistrationNewForm sponsorCode={sponsorCode} />
    </div>
  );
}
