import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { signAccessToken } from '@/lib/auth/jwt';
import { getLgasForState } from '@/lib/nigeria-locations';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json();

    const {
      // Step 1: Personal Info
      gender,
      dob,
      country = 'Nigeria',
      state,
      stateOfOrigin,
      lga,
      city,
      address,

      // Step 2: Next of Kin
      nextOfKinName,
      nextOfKinPhone,
      relationship,
      nextOfKinAddress,

      // Step 3: Bank Details
      bankName,
      accountNumber,
      accountName,
    } = body;

    // Validate essential profile fields
    if (
      !gender ||
      !dob ||
      !state ||
      !stateOfOrigin ||
      !lga ||
      !city ||
      !address ||
      !nextOfKinName ||
      !nextOfKinPhone ||
      !relationship ||
      !nextOfKinAddress ||
      !bankName ||
      !accountNumber ||
      !accountName
    ) {
      return NextResponse.json(
        { message: 'All profile, next of kin, and banking fields are required.' },
        { status: 400 }
      );
    }

    if (gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json(
        { message: 'Gender must be either Male or Female.' },
        { status: 400 }
      );
    }

    // Backend validation: Verify LGA belongs to the selected state of origin
    const validLgas = getLgasForState(stateOfOrigin);
    if (!validLgas.includes(lga)) {
      return NextResponse.json(
        { message: 'Invalid LGA for selected State of Origin.' },
        { status: 400 }
      );
    }

    // Fetch user details to get Name for KYC
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if (user.onboardingStatus === 'COMPLETE') {
      return NextResponse.json({ message: 'Onboarding is already complete.' }, { status: 400 });
    }

    const fullName = user.name || `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || 'Unknown Member';
    const phone = user.profile?.phone || 'Not Provided';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert MemberProfile
      await tx.memberProfile.upsert({
        where: { userId },
        create: {
          userId,
          gender,
          dob: new Date(dob),
          country,
          state,
          stateOfOrigin,
          lga,
          city,
          address,
          nextOfKinName,
          nextOfKinPhone,
          relationship,
          nextOfKinAddress,
        },
        update: {
          gender,
          dob: new Date(dob),
          country,
          state,
          stateOfOrigin,
          lga,
          city,
          address,
          nextOfKinName,
          nextOfKinPhone,
          relationship,
          nextOfKinAddress,
        },
      });

      // 3. Create Wallet if it doesn't exist
      await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balance: 0,
        },
        update: {}, // No updates if it already exists
      });

      // 4. Update User record with bank details, KYC status, and complete onboarding
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          bankName,
          accountNumber,
          accountName,
          onboardingStatus: 'COMPLETE',
        },
      });

      return updatedUser;
    });

    // Generate a new Access Token (JWT) with updated onboardingStatus
    const accessToken = await signAccessToken({
      sub: result.id,
      role: result.role,
      status: result.status,
      onboardingStatus: 'COMPLETE',
      sessionVersion: result.sessionVersion,
    });

    const response = NextResponse.json({
      message: 'Onboarding completed successfully',
      accessToken,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        status: result.status,
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
    console.error('Unified onboarding submission error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during onboarding submission.' },
      { status: 500 }
    );
  }
}
