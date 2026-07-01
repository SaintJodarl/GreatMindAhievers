import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email address is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up the user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Create reset request
      await prisma.passwordResetRequest.create({
        data: {
          userId: user.id,
          email: normalizedEmail,
          status: 'PENDING',
        },
      });

      // Log audit event
      await prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          targetType: 'User',
          targetId: user.id,
          details: `Password reset request submitted for ${normalizedEmail}`,
          ipAddress,
          userAgent,
        },
      });
    }

    // Generic response to avoid user enumeration leaks
    return NextResponse.json({
      message:
        'If the email address is registered, your password reset request has been submitted successfully. An administrator will review your request and contact you.',
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during password reset request' },
      { status: 500 }
    );
  }
}
