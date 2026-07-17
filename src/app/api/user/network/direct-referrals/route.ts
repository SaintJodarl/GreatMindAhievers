import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import {
  getBinaryTreeScope,
  getMemberBinaryLegCounts,
  resolveRelativeBinaryLeg,
} from '@/lib/network/genealogy';
import { getStageDisplayName } from '@/lib/qualification/constants';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const loggedInUserId = currentUser.id;
    const { searchParams } = new URL(req.url);

    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (parseInt(searchParams.get('page') || '1') - 1) * limit;

    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {
      sponsorId: loggedInUserId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    }

    const sponsorTree = await getBinaryTreeScope(prisma, loggedInUserId);

    const [referrals, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          activationCode: {
            select: { status: true },
          },
          placement: {
            select: {
              id: true,
              name: true,
            },
          },
          binaryTree: {
            select: {
              path: true,
              depth: true,
              parentId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const referralLegCounts = await Promise.all(
      referrals.map((referral) => getMemberBinaryLegCounts(prisma, referral.id))
    );

    return NextResponse.json({
      referrals: referrals.map((referral, index) => ({
        id: referral.id,
        name: referral.name,
        email: referral.email,
        referralCode: referral.referralCode,
        status: referral.status,
        kycStatus: referral.kycStatus,
        currentStage: referral.currentStage,
        currentStageName: getStageDisplayName(referral.currentStage),
        activationStatus: referral.activationCode?.status ?? null,
        leftLegCount: referralLegCounts[index].leftLegCount,
        rightLegCount: referralLegCounts[index].rightLegCount,
        createdAt: referral.createdAt,
        binaryPosition: referral.binaryPosition,
        binaryLegRelativeToSponsor: resolveRelativeBinaryLeg(sponsorTree, referral.binaryTree),
        placementParent: referral.placement
          ? {
              id: referral.placement.id,
              name: referral.placement.name || 'Unknown',
            }
          : null,
        binaryParentId: referral.binaryTree?.parentId ?? null,
      })),
      pagination: {
        total,
        limit,
        offset,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Direct referrals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
