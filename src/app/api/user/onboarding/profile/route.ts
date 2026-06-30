import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
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

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Upsert MemberProfile (personal info + next of kin)
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

      // 2. Update User record with bank details (no activation or onboarding completion here)
      await tx.user.update({
        where: { id: userId },
        data: {
          bankName,
          accountNumber,
          accountName,
        },
      });
    });

    return NextResponse.json({
      message: 'Profile and banking information saved successfully.',
    });
  } catch (error: any) {
    console.error('Onboarding profile save error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during profile save.' },
      { status: 500 }
    );
  }
}
