import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';
import { signAccessToken } from '@/lib/auth/jwt';

const cleanText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json();

    const firstName = cleanText(body.firstName);
    const lastName = cleanText(body.lastName);
    const email = cleanText(body.email);
    const phone = cleanText(body.phone);
    const gender = cleanText(body.gender);
    const dob = cleanText(body.dob);
    const address = cleanText(body.address);
    const bankName = cleanText(body.bankName);
    const accountNumber = cleanText(body.accountNumber);
    const accountName = cleanText(body.accountName);

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
      return NextResponse.json(
        { message: 'Date of birth must be a valid date.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, onboardingStatus: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if (user.onboardingStatus === 'COMPLETE') {
      return NextResponse.json({ message: 'Onboarding is already complete.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    if (user.email && user.email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { message: 'Email address must match the registered account email.' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.memberProfile.upsert({
        where: { userId },
        create: {
          userId,
          firstName,
          lastName,
          phone,
          gender,
          dob: parsedDob,
          address,
        },
        update: {
          firstName,
          lastName,
          phone,
          gender,
          dob: parsedDob,
          address,
        },
      });

      await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balance: 0,
        },
        update: {},
      });

      return tx.user.update({
        where: { id: userId },
        data: {
          email: user.email || normalizedEmail,
          bankName,
          accountNumber,
          accountName,
          onboardingStep: 4,
          onboardingStatus: 'COMPLETE',
          kycStatus: 'COMPLETE',
          kycSubmittedAt: new Date(),
          kycRejectedAt: null,
          kycRejectionReason: null,
        },
      });
    });

    const accessToken = await signAccessToken({
      sub: result.id,
      role: result.role,
      status: result.status,
      onboardingStatus: result.onboardingStatus,
      sessionVersion: result.sessionVersion,
    });

    const response = NextResponse.json({
      message: 'Registration completed successfully.',
      accessToken,
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role,
        status: result.status,
        onboardingStatus: result.onboardingStatus,
      },
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
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
