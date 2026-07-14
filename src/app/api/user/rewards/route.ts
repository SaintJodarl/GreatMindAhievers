import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import {
  getNextStage,
  getRequirementText,
  getStageDisplayName,
  getStageNumberLabel,
  normalizeStageId,
} from '@/lib/qualification/constants';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        currentStage: true,
        highestStage: true,
        stageUpdatedAt: true,
        finalStageCompletedAt: true,
        compensationPlanStatus: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const currentStage = normalizeStageId(user.currentStage);
    const nextStage = getNextStage(currentStage);

    const rewards = await prisma.reward.findMany({
      where: { userId: session.user.id },
      include: {
        claims: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const progress = await prisma.stageProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    const history = await prisma.stageHistory.findMany({
      where: { memberId: session.user.id },
      include: {
        contributors: {
          include: {
            contributorMember: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                currentStage: true,
              },
            },
          },
          orderBy: [
            { contributorQualifiedAt: 'asc' },
            { genealogyDepth: 'asc' },
            { contributorMemberId: 'asc' },
          ],
        },
      },
      orderBy: { qualifiedAt: 'asc' },
    });

    const loans = await prisma.stageLoan.findMany({
      where: { userId: session.user.id },
      include: {
        auditEntries: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json({
      rewards: rewards.map((reward) => ({
        ...reward,
        stageName: getStageDisplayName(reward.stage),
      })),
      progress: progress.map((item) => ({
        ...item,
        stageName: getStageDisplayName(item.stage),
        requirementStageName: item.requirementStage
          ? getStageDisplayName(item.requirementStage)
          : null,
      })),
      history: history.map((item) => ({
        ...item,
        fromStageName: getStageDisplayName(item.fromStage),
        toStageName: getStageDisplayName(item.toStage),
        contributors: item.contributors.map((contributor) => ({
          ...contributor,
          contributorStageName: getStageDisplayName(contributor.contributorStageAtQualification),
          contributorMember: {
            ...contributor.contributorMember,
            currentStageName: getStageDisplayName(contributor.contributorMember.currentStage),
          },
        })),
      })),
      loans: loans.map((loan) => ({
        ...loan,
        stageName: getStageDisplayName(loan.stage),
      })),
      stageSummary: {
        currentStage,
        currentStageName: getStageDisplayName(currentStage),
        currentStageNumberLabel: getStageNumberLabel(currentStage),
        highestStage: normalizeStageId(user.highestStage),
        highestStageName: getStageDisplayName(user.highestStage),
        stageUpdatedAt: user.stageUpdatedAt,
        compensationPlanStatus: user.compensationPlanStatus,
        finalStageCompletedAt: user.finalStageCompletedAt,
        nextStage,
        nextStageName: nextStage ? getStageDisplayName(nextStage) : null,
        nextRequirement: getRequirementText(nextStage),
      },
    });
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

    if (!rewardId || !['CASH', 'FOOD', 'PACKAGE'].includes(selectedOption)) {
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
