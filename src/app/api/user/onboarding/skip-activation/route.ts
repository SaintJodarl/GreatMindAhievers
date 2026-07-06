import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { signAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // Update User record: activation is the final onboarding step in the simplified flow.
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: 4,
        onboardingStatus: 'COMPLETE',
        kycStatus: 'COMPLETE',
        kycSubmittedAt: new Date(),
        kycRejectedAt: null,
        kycRejectionReason: null,
      },
    });

    // Generate a new Access Token (JWT) with updated onboardingStatus
    const accessToken = await signAccessToken({
      sub: updatedUser.id,
      role: updatedUser.role,
      status: updatedUser.status,
      onboardingStatus: 'COMPLETE',
      sessionVersion: updatedUser.sessionVersion,
    });

    const response = NextResponse.json({
      message: 'Activation skipped. Onboarding completed.',
      accessToken,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        onboardingStatus: 'COMPLETE',
      },
    });

    // Write updated cookie for middleware page reload compatibility
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Onboarding skip activation error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during skip activation.' },
      { status: 500 }
    );
  }
}
