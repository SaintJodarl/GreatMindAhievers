import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import bcrypt from 'bcryptjs';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { password, notes } = body;

    if (!password) {
      return NextResponse.json({ message: 'Temporary password is required' }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        {
          message:
            'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        },
        { status: 400 }
      );
    }

    // Fetch the reset request
    const request = await prisma.passwordResetRequest.findUnique({
      where: { id },
    });

    if (!request) {
      return NextResponse.json({ message: 'Request not found' }, { status: 404 });
    }

    if (!request.userId) {
      return NextResponse.json({ message: 'Request is not linked to any registered user' }, { status: 400 });
    }

    // Fetch the target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: request.userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Privilege boundaries: Super Admin can reset anyone; Admin can only reset MEMBER
    const isCallerSuperAdmin = auth.user!.role === 'SUPER_ADMIN';

    if (!isCallerSuperAdmin && targetUser.role !== 'MEMBER') {
      // Failed attempt log
      await prisma.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'FAILED_PASSWORD_RESET_ATTEMPT',
          targetType: 'User',
          targetId: targetUser.id,
          details: `Unauthorized attempt by admin to reset password for admin account: ${targetUser.email}`,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json(
        { message: 'Forbidden: Admins can only reset passwords for members.' },
        { status: 403 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user & reset request within transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUser.id },
        data: {
          password: hashedPassword,
          isPasswordTemporary: true, // mark temporary flag!
          sessionVersion: { increment: 1 },
        },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: targetUser.id },
      }),
      prisma.passwordResetRequest.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          resolvedBy: auth.user!.id,
          notes: notes || request.notes,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'TEMPORARY_PASSWORD_ISSUED',
          targetType: 'User',
          targetId: targetUser.id,
          details: `Temporary password issued to ${targetUser.email}`,
          ipAddress,
          userAgent,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'PASSWORD_RESET_COMPLETED',
          targetType: 'PasswordResetRequest',
          targetId: request.id,
          details: `Password reset request completed for ${targetUser.email}`,
          ipAddress,
          userAgent,
        },
      }),
    ]);

    return NextResponse.json({
      message: `Password reset completed successfully. Temporary password: ${password}`,
      temporaryPassword: password,
    });
  } catch (error: any) {
    console.error('Execute reset password error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
