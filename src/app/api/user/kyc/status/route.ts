import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycSubmittedAt: true,
        kycApprovedAt: true,
        kycRejectedAt: true,
        kycRejectionReason: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('KYC status error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch KYC status' },
      { status: 500 }
    );
  }
}
