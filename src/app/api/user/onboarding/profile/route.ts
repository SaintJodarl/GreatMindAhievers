import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
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
        { message: 'All profile, next of kin, and banking fields are required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert MemberProfile
      const profile = await tx.memberProfile.upsert({
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

      // 2. Update User bank details
      await tx.user.update({
        where: { id: userId },
        data: {
          bankName,
          accountNumber,
          accountName,
        },
      });

      return profile;
    });

    return NextResponse.json({
      message: 'Profile details saved successfully',
      profile: result,
    });
  } catch (error: any) {
    console.error('Onboarding profile save error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
