import { getCurrentUser } from '@/lib/auth/session';
import React from 'react';


import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReferralLinkClient from './ReferralLinkClient';

export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Referral Link | GMA Network',
};

export default async function ReferralLinkPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Referral Link</h1>
        <p className="text-gray-500 mt-1">Share your unique link to invite new members.</p>
      </div>

      <ReferralLinkClient referralCode={user?.referralCode || ''} />
    </div>
  );
}
