import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { generateUniqueReferralCode } from '@/lib/referral-code';
import { executePlacementWithTx } from '@/lib/binary-placement/utils';
import { BinaryPosition } from '@/lib/binary-placement/constants';

export async function POST(req: NextRequest) {
  try {
    let {
      firstName,
      lastName,
      name,
      email,
      username,
      password,
      phone,
      sponsorCode,
    } = await req.json();

    // Fallback split name into firstName and lastName if only name is provided
    if (name && (!firstName || !lastName)) {
      const parts = name.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'First name, last name, email, and password are required' },
        { status: 400 }
      );
    }

    // Fallback username if missing
    if (!username) {
      username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(1000 + Math.random() * 9000);
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check unique email
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Check unique username
    const usernameExists = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (usernameExists) {
      return NextResponse.json(
        { message: 'An account with this username already exists' },
        { status: 400 }
      );
    }

    let sponsorId: string | null = null;
    let autoCalculatedPosition: 'LEFT' | 'RIGHT' = 'LEFT';

    if (sponsorCode) {
      const sponsor = await prisma.user.findUnique({
        where: { referralCode: sponsorCode.toUpperCase().trim() },
      });
      if (sponsor) {
        sponsorId = sponsor.id;
        // Auto-assign placement position based on sponsor's preference
        autoCalculatedPosition = sponsor.preferredPosition === 'RIGHT' ? 'RIGHT' : 'LEFT';
      } else {
        return NextResponse.json(
          { message: 'Sponsor / referral code is invalid' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = await generateUniqueReferralCode(prisma);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User (Active immediately, but incomplete onboarding status)
      const user = await tx.user.create({
        data: {
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.toLowerCase().trim(),
          username: username.toLowerCase().trim(),
          password: hashedPassword,
          role: 'MEMBER',
          status: 'ACTIVE',
          onboardingStatus: 'INCOMPLETE',
          autoPlacement: true,
          referralCode,
          sponsorId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          referralCode: true,
          role: true,
          status: true,
          onboardingStatus: true,
          createdAt: true,
        },
      });

      // 2. Create empty MemberProfile
      await tx.memberProfile.create({
        data: {
          userId: user.id,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : '',
        },
      });

      // 3. Perform MLM placement automatically
      const placement = await executePlacementWithTx(tx, {
        sponsorId,
        preferredPosition: autoCalculatedPosition as BinaryPosition,
        userId: user.id,
      });

      return { user, placement };
    });

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          ...result.user,
          placement: {
            userId: result.placement.userId,
            placementId: result.placement.placementId,
            parentId: result.placement.parentId,
            binaryPosition: result.placement.binaryPosition,
            depth: result.placement.depth,
          },
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
