import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { getRewardWithdrawalEligibility } from '@/lib/withdrawals/reward-eligibility';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rewardId = searchParams.get('rewardId');
    const eligibility = await getRewardWithdrawalEligibility(prisma, currentUser.id, { rewardId });

    return NextResponse.json({ eligibility });
  } catch (error: any) {
    console.error('Reward withdrawal eligibility error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
