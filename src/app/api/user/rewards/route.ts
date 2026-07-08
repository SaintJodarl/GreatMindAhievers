import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const rewards = await prisma.reward.findMany({
      where: { userId: session.user.id },
      include: {
        claims: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const progress = await prisma.stageProgress.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ rewards, progress });
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { rewardId, selectedOption } = await req.json();

    if (!rewardId || !['CASH', 'FOOD'].includes(selectedOption)) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || reward.userId !== session.user.id) {
      return new NextResponse('Reward not found', { status: 404 });
    }

    if (reward.status !== 'EARNED') {
      return new NextResponse('Reward already claimed', { status: 400 });
    }

    const claim = await prisma.$transaction(async (tx) => {
      // Create the claim
      const newClaim = await tx.rewardClaim.create({
        data: {
          rewardId,
          userId: session.user.id,
          selectedOption,
          status: 'PENDING_ADMIN_PROCESSING',
        },
      });

      // Mark reward as CLAIMED
      await tx.reward.update({
        where: { id: rewardId },
        data: { status: 'CLAIMED' },
      });

      return newClaim;
    });

    return NextResponse.json(claim);
  } catch (error: any) {
    console.error('Error claiming reward:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
