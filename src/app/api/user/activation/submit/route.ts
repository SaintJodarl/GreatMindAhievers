import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';


import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ message: 'Activation code is required' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // 1. Get client IP address for brute-force tracking
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // 2. Check failed attempts / lockout (5 attempts within 15 minutes)
    const attemptRecord = await prisma.activationAttempt.findUnique({
      where: {
        userId_ipAddress: {
          userId,
          ipAddress,
        },
      },
    });

    const LOCKOUT_MINUTES = 15;
    const MAX_ATTEMPTS = 5;

    if (attemptRecord && attemptRecord.attempts >= MAX_ATTEMPTS) {
      const timeDiff = Date.now() - new Date(attemptRecord.lastAttempt).getTime();
      const lockDurationMs = LOCKOUT_MINUTES * 60000;
      if (timeDiff < lockDurationMs) {
        const remainingMin = Math.ceil((lockDurationMs - timeDiff) / 60000);
        return NextResponse.json(
          { message: `Too many failed attempts. Locked out. Try again in ${remainingMin} minutes.` },
          { status: 429 }
        );
      }
    }

    // 3. Find code
    const dbCode = await prisma.activationCode.findUnique({
      where: { code: normalizedCode },
    });

    // Handle invalid code
    if (!dbCode) {
      await logFailedAttempt(userId, ipAddress, attemptRecord);
      return NextResponse.json({ message: 'Invalid activation code' }, { status: 400 });
    }

    // Handle code status
    if (dbCode.status !== 'UNUSED') {
      await logFailedAttempt(userId, ipAddress, attemptRecord);
      return NextResponse.json(
        { message: `Activation code is already ${dbCode.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check expiration
    if (dbCode.expirationDate && new Date(dbCode.expirationDate) < new Date()) {
      await prisma.activationCode.update({
        where: { id: dbCode.id },
        data: { status: 'EXPIRED' },
      });
      await logFailedAttempt(userId, ipAddress, attemptRecord);
      return NextResponse.json({ message: 'Activation code has expired' }, { status: 400 });
    }

    // 4. Perform redemption in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark code as used
      await tx.activationCode.update({
        where: { id: dbCode.id },
        data: {
          status: 'USED',
          redeemedBy: userId,
          redeemedDate: new Date(),
        },
      });

      // Reset lockout counter
      if (attemptRecord) {
        await tx.activationAttempt.delete({
          where: {
            id: attemptRecord.id,
          },
        });
      }

      // Fetch user profile and KYC details
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      let nextStatus = 'PENDING_ACTIVATION';
      if (user?.kycStatus === 'APPROVED') {
        nextStatus = 'ACTIVE';
        await tx.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' },
        });
      }

      // Log activation action to AuditLog
      await tx.auditLog.create({
        data: {
          adminId: userId,
          action: 'REDEEM_ACTIVATION_CODE',
          targetType: 'ActivationCode',
          targetId: dbCode.id,
          details: `User ${userId} redeemed activation code ${normalizedCode}. Account status is ${nextStatus}.`,
          ipAddress,
          userAgent: req.headers.get('user-agent'),
        },
      });

      return { nextStatus };
    });

    return NextResponse.json({
      message: result.nextStatus === 'ACTIVE'
        ? 'Account successfully activated! Full platform access unlocked.'
        : 'Activation code redeemed successfully! Status pending KYC approval.',
      status: result.nextStatus,
    });
  } catch (error: any) {
    console.error('Submit activation code error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function logFailedAttempt(userId: string, ipAddress: string, record: any) {
  if (record) {
    const timeDiff = Date.now() - new Date(record.lastAttempt).getTime();
    const lockDurationMs = 15 * 60000;
    const isReset = timeDiff >= lockDurationMs;

    await prisma.activationAttempt.update({
      where: { id: record.id },
      data: {
        attempts: isReset ? 1 : record.attempts + 1,
        lastAttempt: new Date(),
      },
    });
  } else {
    await prisma.activationAttempt.create({
      data: {
        userId,
        ipAddress,
        attempts: 1,
        lastAttempt: new Date(),
      },
    });
  }
}
