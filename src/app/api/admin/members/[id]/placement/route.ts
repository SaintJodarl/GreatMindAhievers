import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import { updateAncestorCounters } from '@/lib/binary-placement/utils';
import { checkUserQualification } from '@/lib/qualification/engine';
import { BinaryPosition } from '@/lib/binary-placement/constants';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check if user is SUPER_ADMIN (manual overrides are restricted to super admins)
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    if (auth.user?.adminRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { binaryTree: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 });
    }

    const body = await req.json();
    const { placementId, binaryPosition } = body; // binaryPosition: LEFT or RIGHT

    if (!placementId || !binaryPosition || !['LEFT', 'RIGHT'].includes(binaryPosition)) {
      return NextResponse.json(
        { message: 'Missing or invalid placement parameters' },
        { status: 400 }
      );
    }

    // Verify parent tree node exists
    const parentTree = await prisma.binaryTree.findUnique({
      where: { userId: placementId },
    });

    if (!parentTree) {
      return NextResponse.json(
        { message: 'Target parent node not found in binary tree' },
        { status: 400 }
      );
    }

    // Check if slot is already occupied
    const isSlotOccupied =
      binaryPosition === 'LEFT' ? parentTree.leftChildId : parentTree.rightChildId;
    if (isSlotOccupied && isSlotOccupied !== user.id) {
      return NextResponse.json(
        { message: `Target slot ${binaryPosition} under parent is already occupied` },
        { status: 400 }
      );
    }

    const newPath = `${parentTree.path}/${user.id}`;
    const newDepth = parentTree.depth + 1;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if user already has children - moving subtrees is too risky without full recalculation
      if (user.binaryTree?.leftChildId || user.binaryTree?.rightChildId) {
        throw new Error('Cannot move user with existing children - subtree move requires full recalculation');
      }

      // 2. Check for self-placement
      if (user.id === placementId) {
        throw new Error('Cannot place user as their own parent');
      }

      // 3. Remove user from old parent's child pointer (if they had a parent)
      if (user.binaryTree && user.binaryTree.parentId) {
        const oldParent = await tx.binaryTree.findUnique({
          where: { userId: user.binaryTree.parentId },
        });
        if (oldParent) {
          const isLeft = oldParent.leftChildId === user.id;
          await tx.binaryTree.update({
            where: { userId: user.binaryTree.parentId },
            data: isLeft ? { leftChildId: null } : { rightChildId: null },
          });
        }
      }

      // 4. Set new parent's child pointer
      await tx.binaryTree.update({
        where: { userId: placementId },
        data: binaryPosition === 'LEFT' ? { leftChildId: user.id } : { rightChildId: user.id },
      });

      // 5. Update user's BinaryTree row
      const updatedTree = await tx.binaryTree.update({
        where: { userId: user.id },
        data: {
          parentId: placementId,
          path: newPath,
          depth: newDepth,
        },
      });

      // 6. Update user's User row
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          placementId,
          binaryPosition,
        },
      });

      // 7. Update ancestor counters for the NEW placement
      await updateAncestorCounters(tx, user.id, binaryPosition as BinaryPosition);

      // 8. Trigger qualification checks for both the moved user and the new parent
      await checkUserQualification(tx, user.id);
      await checkUserQualification(tx, placementId);

      // 9. Log action to Audit log
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'MANUAL_PLACEMENT_OVERRIDE',
          targetType: 'User',
          targetId: user.id,
          details: `Manually moved user ${user.email} to parent ${placementId} position ${binaryPosition} with counter and qualification recalculation`,
        },
      });

      return { updatedUser, updatedTree };
    });

    return NextResponse.json({
      message: 'Member placement manually overridden successfully',
      ...result,
    });
  } catch (error: any) {
    console.error('Manual placement override error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
