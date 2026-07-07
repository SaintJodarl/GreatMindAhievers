import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';


import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReferralCodeClient from './ReferralCodeClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Referral Code | GMA Network',
};

export default async function ReferralCodePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/sign-up-login-screen');
  }

  const userId = currentUser.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Referral Code</h1>
        <p className="text-gray-550 mt-1">Your unique code and QR code for new registrations.</p>
      </div>

      <ReferralCodeClient referralCode={user?.referralCode || ''} />
    </div>
  );
}
