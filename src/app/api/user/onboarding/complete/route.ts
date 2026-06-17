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

    // Fetch user details to make sure they exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, kycSubmission: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update user onboarding status to COMPLETE in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStatus: 'COMPLETE',
        // If they already submitted KYC during onboarding, status should transition
        status: user.kycStatus === 'SUBMITTED' ? 'PENDING_KYC_REVIEW' : 'ACTIVE',
      },
    });

    // Generate a new Access Token (JWT) with updated onboardingStatus
    const accessToken = await signAccessToken({
      sub: updatedUser.id,
      role: updatedUser.role,
      status: updatedUser.status,
      onboardingStatus: 'COMPLETE',
    });

    const response = NextResponse.json({
      message: 'Onboarding completed successfully',
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
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error('Onboarding completion error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
