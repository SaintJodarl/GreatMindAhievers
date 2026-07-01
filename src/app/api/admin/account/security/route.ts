import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import bcrypt from 'bcryptjs';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const auth = await verifyAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const userId = auth.user!.id;
    const body = await req.json().catch(() => ({}));
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { message: 'New password cannot be the same as the current password' },
        { status: 400 }
      );
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

    // Fetch user details including password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Admin not found' }, { status: 404 });
    }

    // Verify current password
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        // Log failed attempt
        await prisma.auditLog.create({
          data: {
            adminId: userId,
            action: 'FAILED_PASSWORD_CHANGE_ATTEMPT',
            targetType: 'User',
            targetId: userId,
            details: `Admin failed own password change: incorrect current password`,
            ipAddress,
            userAgent,
          },
        });

        return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and increment sessionVersion (to force logout)
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        sessionVersion: { increment: 1 },
      },
    });

    // Invalidate refresh tokens to force all sessions out
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Log successful change
    await prisma.auditLog.create({
      data: {
        adminId: userId,
        action: 'PASSWORD_CHANGED',
        targetType: 'User',
        targetId: userId,
        details: `Admin successfully changed own password`,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Admin password change error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
