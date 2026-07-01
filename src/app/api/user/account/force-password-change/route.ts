import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { signAccessToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

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

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.isPasswordTemporary) {
      return NextResponse.json({ message: 'Password is not marked as temporary' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const newSessionVersion = (user.sessionVersion || 1) + 1;

    // Update password and clear temporary flag within transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          isPasswordTemporary: false, // clear temporary flag!
          sessionVersion: newSessionVersion,
        },
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
      prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'PASSWORD_CHANGED_AFTER_RESET',
          targetType: 'User',
          targetId: user.id,
          details: `User completed mandatory password reset update`,
          ipAddress,
          userAgent,
        },
      }),
    ]);

    // Sign new Access Token with isPasswordTemporary: false
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      status: user.status,
      onboardingStatus: user.onboardingStatus,
      sessionVersion: newSessionVersion,
      isPasswordTemporary: false, // explicitly clear it!
    });

    const response = NextResponse.json({
      message: 'Password updated successfully! Welcome to your dashboard.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        onboardingStatus: user.onboardingStatus,
        isPasswordTemporary: false,
      },
    });

    // Write updated cookie
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error('Force password change error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during password change' },
      { status: 500 }
    );
  }
}
