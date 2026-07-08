import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Find token and family in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (tokenRecord) {
        // Revoke the entire family tree of refresh tokens to clean up
        await prisma.refreshToken.updateMany({
          where: { familyId: tokenRecord.familyId },
          data: { revoked: true },
        });

        // Delete expired/revoked tokens for this user to keep DB clean
        await prisma.refreshToken.deleteMany({
          where: {
            userId: tokenRecord.userId,
            OR: [{ revoked: true }, { expiresAt: { lt: new Date() } }],
          },
        });
      }
    }

    const response = NextResponse.json({ message: 'Logged out successfully' });

    // Clear cookies
    response.cookies.delete('refreshToken');
    response.cookies.delete('accessToken');

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
