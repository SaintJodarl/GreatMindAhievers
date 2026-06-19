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

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      req.headers.get('x-real-ip')?.trim() || 
                      (req as any).ip || 
                      null;

    let recentSignupsCount = 0;
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      recentSignupsCount = await prisma.auditLog.count({
        where: {
          ipAddress,
          action: 'USER_REGISTER',
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });
    }

    if (ipAddress && recentSignupsCount >= 5) {
      console.warn(`[SIGNUP FARMING WARNING] High registration frequency detected from IP: ${ipAddress} (${recentSignupsCount} signups in the last hour)`);
      await prisma.auditLog.create({
        data: {
          adminId: 'SYSTEM',
          action: 'SIGNUP_FARMING_ALERT',
          targetType: 'IPAddress',
          targetId: ipAddress,
          details: `High registration frequency detected from IP: ${ipAddress}. ${recentSignupsCount} signups in the last hour.`,
          ipAddress,
          userAgent: req.headers.get('user-agent') || null,
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = await generateUniqueReferralCode(prisma);

    let user;
    try {
      user = await prisma.$transaction(async (tx) => {
        // 1. Create User (Active immediately, but incomplete onboarding status)
        const createdUser = await tx.user.create({
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

        // 1.1 Compute and update materialized path and depth
        let sponsorPath = "";
        let sponsorDepth = 0;
        if (sponsorId) {
          const sponsorUser = await tx.user.findUnique({
            where: { id: sponsorId },
            select: { path: true, depth: true }
          });
          if (sponsorUser) {
            sponsorPath = sponsorUser.path || `root/${sponsorId}`;
            sponsorDepth = sponsorUser.depth || 0;
          }
        }
        const userPath = sponsorId ? `${sponsorPath}/${createdUser.id}` : `root/${createdUser.id}`;
        const userDepth = sponsorId ? sponsorDepth + 1 : 0;

        await tx.user.update({
          where: { id: createdUser.id },
          data: {
            path: userPath,
            depth: userDepth,
          },
        });

        // 2. Create empty MemberProfile
        await tx.memberProfile.create({
          data: {
            userId: createdUser.id,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone ? phone.trim() : '',
          },
        });

        return createdUser;
      }, {
        timeout: 10000 // 10s timeout safety for user creation
      });
    } catch (createError: any) {
      console.error('Base user creation failed:', createError);
      return NextResponse.json(
        { message: 'Database is busy. Base user account creation failed. Please try again.' },
        { status: 500 }
      );
    }

    let placementResult = null;
    try {
      placementResult = await prisma.$transaction(async (tx) => {
        // 3. Perform MLM placement automatically
        const placement = await executePlacementWithTx(tx, {
          sponsorId,
          preferredPosition: autoCalculatedPosition as BinaryPosition,
          userId: user.id,
        });

        // 4. Log standard successful USER_REGISTER audit event
        await tx.auditLog.create({
          data: {
            adminId: user.id,
            action: 'USER_REGISTER',
            targetType: 'User',
            targetId: user.id,
            details: `User registered successfully: ${user.email}`,
            ipAddress,
            userAgent: req.headers.get('user-agent') || null,
          },
        });

        return placement;
      }, {
        timeout: 15000 // 15s timeout safety for binary placement
      });
    } catch (placementError: any) {
      console.error('Placement transaction failed, logging and applying fallback:', placementError);
      
      // Fallback Safety: Log audit trail so that placement can be retried / inspected manually.
      try {
        await prisma.auditLog.create({
          data: {
            adminId: 'SYSTEM',
            action: 'USER_PLACEMENT_PENDING_RETRY',
            targetType: 'User',
            targetId: user.id,
            details: `User registration succeeded, but MLM placement failed with error: ${placementError.message}. Set to pending retry.`,
            ipAddress,
            userAgent: req.headers.get('user-agent') || null,
          },
        });
      } catch (logErr) {
        console.error('Failed to log placement pending alert:', logErr);
      }
    }

    return NextResponse.json(
      {
        message: placementResult ? 'Registration successful' : 'Registration successful (Placement Pending)',
        user: {
          ...user,
          placement: placementResult ? {
            userId: placementResult.userId,
            placementId: placementResult.placementId,
            parentId: placementResult.parentId,
            binaryPosition: placementResult.binaryPosition,
            depth: placementResult.depth,
          } : null,
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
