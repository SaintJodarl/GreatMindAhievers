import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { signAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const oldRefreshToken = req.cookies.get('refreshToken')?.value;

    if (!oldRefreshToken) {
      return NextResponse.json({ message: 'Refresh token is missing' }, { status: 401 });
    }

    const oldHash = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');

    // Retrieve the token record from the database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash: oldHash },
      include: { user: true },
    });

    // 1. REUSE DETECTION (Replay attack prevention)
    if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
      if (tokenRecord) {
        // Revoke all tokens in this family immediately
        await prisma.refreshToken.updateMany({
          where: { familyId: tokenRecord.familyId },
          data: { revoked: true },
        });

        // Log security alert to audit logs
        await prisma.auditLog.create({
          data: {
            adminId: tokenRecord.userId,
            action: 'REFRESH_TOKEN_REUSE_ALERT',
            targetType: 'User',
            targetId: tokenRecord.userId,
            details: `Potential refresh token replay attack detected for family ${tokenRecord.familyId}. Revoked entire family.`,
          },
        });
      }

      // Clear the cookie and force login using the correct path to override the existing cookie
      const response = NextResponse.json(
        { message: 'Session compromised or expired. Please login again.' },
        { status: 403 }
      );
      response.cookies.set('refreshToken', '', { path: '/api/auth', maxAge: 0 });
      response.cookies.set('refreshToken', '', { path: '/', maxAge: 0 });
      return response;
    }

    // 2. Verify account status
    if (tokenRecord.user.status === 'SUSPENDED') {
      const response = NextResponse.json({ message: 'Account suspended' }, { status: 403 });
      response.cookies.set('refreshToken', '', { path: '/api/auth', maxAge: 0 });
      response.cookies.set('refreshToken', '', { path: '/', maxAge: 0 });
      return response;
    }

    // 4. Rotate Refresh Token (Create new token, revoke old)
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      }),
      prisma.refreshToken.create({
        data: {
          userId: tokenRecord.userId,
          tokenHash: newHash,
          familyId: tokenRecord.familyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        },
      }),
    ]);

    // 1. Generate new Access Token (JWT)
    const newAccessToken = await signAccessToken({
      sub: tokenRecord.user.id,
      role: tokenRecord.user.role,
      status: tokenRecord.user.status,
      onboardingStatus: tokenRecord.user.onboardingStatus,
      sessionVersion: tokenRecord.user.sessionVersion || 1,
    });

    const response = NextResponse.json({
      message: 'Session refreshed',
    });

    // 5. Set rotated cookies
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
