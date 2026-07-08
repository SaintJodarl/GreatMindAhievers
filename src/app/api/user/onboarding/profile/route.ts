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
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      dob,
      address,
      bankName,
      accountNumber,
      accountName,
    } = body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !gender ||
      !dob ||
      !address ||
      !bankName ||
      !accountNumber ||
      !accountName
    ) {
      return NextResponse.json(
        { message: 'All personal information and banking fields are required.' },
        { status: 400 }
      );
    }

    if (gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json(
        { message: 'Gender must be either Male or Female.' },
        { status: 400 }
      );
    }

    const parsedDob = new Date(dob);
    if (Number.isNaN(parsedDob.getTime())) {
      return NextResponse.json({ message: 'Date of birth must be a valid date.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (user.email && user.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { message: 'Email address must match the registered account email.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.memberProfile.upsert({
        where: { userId },
        create: {
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          gender,
          dob: parsedDob,
          address: address.trim(),
        },
        update: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          gender,
          dob: parsedDob,
          address: address.trim(),
        },
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          email: user.email || normalizedEmail,
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          onboardingStep: 3,
          onboardingStatus: 'COMPLETE',
        },
      });
    });

    const accessToken = await signAccessToken({
      sub: updatedUser.id,
      role: updatedUser.role,
      status: updatedUser.status,
      onboardingStatus: updatedUser.onboardingStatus,
      sessionVersion: updatedUser.sessionVersion,
    });

    const response = NextResponse.json({
      message: 'Personal and banking information saved successfully. Onboarding completed.',
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Onboarding profile save error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error during profile save.' },
      { status: 500 }
    );
  }
}
