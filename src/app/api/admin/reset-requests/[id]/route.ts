import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await req.json().catch(() => ({}));
    const { status, notes } = body;

    if (!status || !['APPROVED', 'REJECTED', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid target status. Must be APPROVED, REJECTED, or COMPLETED.' },
        { status: 400 }
      );
    }

    const request = await prisma.passwordResetRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    // Role privilege boundary checks for password action authorization
    const isCallerSuperAdmin = auth.user!.role === 'SUPER_ADMIN';

    // If target request is linked to a user, check their role level
    if (request.userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { role: true },
      });
      if (targetUser && targetUser.role !== 'MEMBER' && !isCallerSuperAdmin) {
        return NextResponse.json(
          { message: 'Forbidden: Admins can only resolve reset requests for members.' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {
      status,
      notes: notes || request.notes,
      resolvedBy: auth.user!.id,
    };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.passwordResetRequest.update({
      where: { id },
      data: updateData,
    });

    // Audit logs
    let action = 'PASSWORD_RESET_UPDATED';
    if (status === 'APPROVED') action = 'PASSWORD_RESET_APPROVED';
    if (status === 'REJECTED') action = 'PASSWORD_RESET_REJECTED';
    if (status === 'COMPLETED') action = 'PASSWORD_RESET_COMPLETED';

    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action,
        targetType: 'PasswordResetRequest',
        targetId: request.id,
        details: `Reset request for ${request.email} updated to ${status}. Notes: ${notes || 'None'}`,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      message: `Password reset request status successfully updated to ${status}.`,
      request: updated,
    });
  } catch (error: any) {
    console.error('Update reset request error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
