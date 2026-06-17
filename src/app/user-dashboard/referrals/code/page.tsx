import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ReferralCodeClient from './ReferralCodeClient';

export const metadata = {
  title: 'Referral Code | GMA Network',
};

export default async function ReferralCodePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/sign-up-login-screen');
  }

  const userId = session.user.id;

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
