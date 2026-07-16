import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { STAGE_IDS, getHighestStage, getStageRank } from '@/lib/qualification/constants';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 });
    }

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden: Cannot manage administrator accounts via member endpoints' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status } = body; // INACTIVE, SUSPENDED, PENDING_*, or ACTIVE (requires activation code)

    if (
      !status ||
      ![
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'PENDING',
        'PENDING_PROFILE_COMPLETION',
        'PENDING_KYC_REVIEW',
        'PENDING_ACTIVATION',
      ].includes(status)
    ) {
      return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
    }

    // ENFORCEMENT: Setting status to ACTIVE requires a redeemed activation code.
    // Admin users (role ADMIN/SUPER_ADMIN) are exempt from this check.
    if (status === 'ACTIVE' && user.role === 'MEMBER') {
      const redeemedCode = await prisma.activationCode.findUnique({
        where: { redeemedBy: id },
      });

      if (!redeemedCode || redeemedCode.status !== 'USED') {
        return NextResponse.json(
          {
            message:
              'Cannot set member to ACTIVE: No redeemed activation code found. ' +
              'The member must submit a valid activation code first.',
          },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    const shouldEnterStarter =
      status === 'ACTIVE' &&
      user.role === 'MEMBER' &&
      getStageRank(user.currentStage) < getStageRank(STAGE_IDS.STARTER_ENTRY_STAGE);
    const shouldRaiseHighestStage =
      status === 'ACTIVE' &&
      user.role === 'MEMBER' &&
      getStageRank(user.highestStage) < getStageRank(STAGE_IDS.STARTER_ENTRY_STAGE);
    const highestStage = getHighestStage(user.highestStage, STAGE_IDS.STARTER_ENTRY_STAGE);

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status,
        sessionVersion: { increment: 1 },
        ...(shouldEnterStarter
          ? {
              currentStage: STAGE_IDS.STARTER_ENTRY_STAGE,
              highestStage,
              stageUpdatedAt: now,
            }
          : shouldRaiseHighestStage
            ? {
                highestStage,
              }
            : {}),
      },
    });

    // Revoke refresh tokens to invalidate other active sessions immediately
    await prisma.refreshToken.deleteMany({
      where: { userId: id },
    });

    // Log to Audit logs
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'TOGGLE_MEMBER_STATUS',
        targetType: 'User',
        targetId: id,
        details: `Toggled status of user ${user.email} to ${status}`,
      },
    });

    if (status === 'ACTIVE') {
      await prisma.$transaction(async (tx) => {
        const tree = await tx.binaryTree.findUnique({
          where: { userId: id },
          select: { parentId: true },
        });
        const activatedUser = await tx.user.findUnique({
          where: { id },
          select: { sponsorId: true },
        });
        const { checkUserQualification } = await import('@/lib/qualification/engine');
        await checkUserQualification(tx, id);
        if (tree?.parentId) {
          await checkUserQualification(tx, tree.parentId, new Set<string>(), id);
        }
        if (activatedUser?.sponsorId && activatedUser.sponsorId !== tree?.parentId) {
          await checkUserQualification(tx, activatedUser.sponsorId, new Set<string>(), id);
        }
      });
    }

    return NextResponse.json({
      message: `Member status successfully updated to ${status}`,
      user: updated,
    });
  } catch (error: any) {
    console.error('Toggle member status error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
