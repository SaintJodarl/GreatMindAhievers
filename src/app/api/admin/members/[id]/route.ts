import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

// GET: Profile details with sponsor, placement, wallet, KYC
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        binaryTree: true,
        kycSubmission: true,
        sponsor: {
          select: { id: true, name: true, email: true, referralCode: true },
        },
        placement: {
          select: { id: true, name: true, email: true, referralCode: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Member not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Get member details error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: General update (e.g. status or details)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ message: 'Forbidden: Cannot manage administrator accounts via member endpoints' }, { status: 403 });
    }

    const body = await req.json();
    const { name, status, kycStatus } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (kycStatus) updateData.kycStatus = kycStatus;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...updateData,
        sessionVersion: { increment: 1 },
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
        action: 'UPDATE_MEMBER_DETAILS',
        targetType: 'User',
        targetId: id,
        details: `Updated member fields: ${JSON.stringify(updateData)}`,
      },
    });

    return NextResponse.json({
      message: 'Member updated successfully',
      user: updated,
    });
  } catch (error: any) {
    console.error('Update member details error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
