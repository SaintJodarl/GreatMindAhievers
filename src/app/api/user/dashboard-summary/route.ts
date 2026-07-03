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

    // Fetch user details including relations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sponsor: {
          select: {
            name: true,
            email: true,
            referralCode: true,
          },
        },
        wallet: true,
        binaryTree: true,
        activationCode: true,
        profile: true,
        kycSubmission: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Run independent counts and aggregates in parallel after user details are retrieved
    const [directReferrals, earnings, withdrawals, openTicketsCount, announcementsCount] = await Promise.all([
      prisma.user.count({
        where: { sponsorId: userId },
      }),
      user.wallet
        ? prisma.walletTransaction.aggregate({
            where: {
              walletId: user.wallet.id,
              status: 'COMPLETED',
              type: {
                in: ['REFERRAL_BONUS', 'PAIRING_BONUS', 'LEADERSHIP_BONUS'],
              },
            },
            _sum: {
              amount: true,
            },
          })
        : Promise.resolve({ _sum: { amount: null } }),
      prisma.withdrawal.aggregate({
        where: {
          userId,
          status: 'PENDING',
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.ticket.count({
        where: { userId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.content.count({
        where: { isPublished: true },
      }),
    ]);

    const lifetimeEarnings = Number(earnings._sum.amount || 0);
    const pendingWithdrawals = Number(withdrawals._sum.amount || 0);

    const leftVol = Number(user.binaryTree?.leftVolume || 0);
    const rightVol = Number(user.binaryTree?.rightVolume || 0);
    const minVolume = Math.min(leftVol, rightVol);
    let rank = 'Entry';
    if (minVolume >= 100000) rank = 'Diamond';
    else if (minVolume >= 50000) rank = 'Gold';
    else if (minVolume >= 20000) rank = 'Silver';
    else if (minVolume >= 5000) rank = 'Bronze';

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      kycStatus: user.kycStatus,
      kycSubmittedAt: user.kycSubmittedAt,
      kycApprovedAt: user.kycApprovedAt,
      kycRejectedAt: user.kycRejectedAt,
      kycRejectionReason: user.kycRejectionReason,
      referralCode: user.referralCode,
      leftLegCount: user.leftLegCount,
      rightLegCount: user.rightLegCount,
      totalDownlines: user.totalDownlines,
      directReferrals,
      balance: user.wallet?.balance || 0,
      leftVolume: leftVol,
      rightVolume: rightVol,
      cyclesCompleted: user.binaryTree?.cyclesCompleted || 0,
      lifetimeEarnings,
      pendingWithdrawals,
      sponsor: user.sponsor,
      openTicketsCount,
      announcementsCount,
      rank,
      bankName: user.bankName || '',
      accountNumber: user.accountNumber || '',
      accountName: user.accountName || '',
      onboardingStep: user.onboardingStep,
      kycCompleted: user.kycStatus === 'APPROVED' || user.kycStatus === 'SUBMITTED',
      activationStatus: user.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING',
      accountStatus: user.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
      activationCode: user.activationCode ? {
        code: user.activationCode.code,
        status: user.activationCode.status,
        redeemedDate: user.activationCode.redeemedDate,
      } : null,
      profile: user.profile,
      kycSubmission: user.kycSubmission ? {
        idDocument: user.kycSubmission.idDocument,
        selfie: user.kycSubmission.selfie,
        proofOfAddress: user.kycSubmission.proofOfAddress,
        status: user.kycSubmission.status,
      } : null,
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
