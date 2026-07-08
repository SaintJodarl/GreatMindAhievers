import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import bcrypt from 'bcryptjs';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id: targetUserId } = resolvedParams;

    const body = await req.json().catch(() => ({}));
    const { newPassword, confirmPassword } = body;

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: 'New password and confirm password are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return NextResponse.json(
        {
          message:
            'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        },
        { status: 400 }
      );
    }

    // Fetch the target user details
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Target user not found' }, { status: 404 });
    }

    // ROLE HIERARCHY RULES:
    // 1. Super Admin can reset anyone (Super Admin, Admin, Member).
    // 2. Admin can ONLY reset Member.
    // 3. Admin can NEVER reset Super Admin or Admin.
    const isCallerSuperAdmin = auth.user!.role === 'SUPER_ADMIN';

    if (!isCallerSuperAdmin && targetUser.role !== 'MEMBER') {
      // Failed attempt log
      await prisma.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'FAILED_PASSWORD_RESET_ATTEMPT',
          targetType: 'User',
          targetId: targetUser.id,
          details: `Unauthorized attempt to reset password for ${targetUser.email} (Target Role: ${targetUser.role})`,
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and increment sessionVersion (to force logout)
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    // Invalidate refresh tokens to force all sessions out
    await prisma.refreshToken.deleteMany({
      where: { userId: targetUser.id },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'ADMIN_PASSWORD_RESET',
        targetType: 'User',
        targetId: targetUser.id,
        details: `Successfully reset password for user: ${targetUser.email} (Role: ${targetUser.role})`,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      message: `Password reset successfully for ${targetUser.email}. You can now share it manually.`,
    });
  } catch (error: any) {
    console.error('Admin member password reset error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during password reset' },
      { status: 500 }
    );
  }
}
