import { MLM_EVENT_MODE, LEGACY_WRITE_DISABLED } from '@/lib/env';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { generateUniqueReferralCode } from '@/lib/referral-code';
import { executePlacementWithTx } from '@/lib/binary-placement/utils';
import { BinaryPosition } from '@/lib/binary-placement/constants';
import { emitOutboxEvent } from '@/lib/events/outbox';

export const maxDuration = 60; // Allow enough time for Neon cold starts and MLM placement

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'];
const PROTECTED_ADMIN_EMAILS = new Set([
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com',
]);

export async function POST(req: NextRequest) {
  console.log('[AUTH DEBUG] Registration started');
  console.log('SIGNUP START - Request received');
  try {
    const body = await req.json();
    const { name, password, sponsorCode, activationCode, registrationCode } = body;
    let { firstName, lastName, email, username, phone } = body;

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

    email = email.toLowerCase().trim();
    firstName = firstName.trim();
    lastName = lastName.trim();
    phone = typeof phone === 'string' ? phone.trim() : phone;

    // Fallback username if missing
    if (!username) {
      username =
        email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(1000 + Math.random() * 9000);
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
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (exists) {
      const isProtectedAdminEmail =
        Boolean(exists.email) && PROTECTED_ADMIN_EMAILS.has(exists.email!.toLowerCase());
      const isAdminAccount = ADMIN_ROLES.includes(exists.role);

      return NextResponse.json(
        {
          message:
            isProtectedAdminEmail || isAdminAccount
              ? 'This email is reserved for an administrator account'
              : 'An account with this email already exists',
        },
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

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
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
      console.warn(
        `[SIGNUP FARMING WARNING] High registration frequency detected from IP: ${ipAddress} (${recentSignupsCount} signups in the last hour)`
      );
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

    const rawCode = activationCode || registrationCode;
    const codeToValidate =
      typeof rawCode === 'string' && rawCode.trim() ? rawCode.trim().toUpperCase() : null;

    // Activation code is REQUIRED for registration
    if (!codeToValidate) {
      return NextResponse.json(
        { message: 'Activation code is required to complete registration' },
        { status: 400 }
      );
    }

    if (!/^GMA-\d{6}$/.test(codeToValidate)) {
      return NextResponse.json(
        { message: 'Invalid activation code format. Required format: GMA-123456' },
        { status: 400 }
      );
    }

    const dbCode = await prisma.activationCode.findUnique({
      where: { code: codeToValidate },
    });

    if (!dbCode) {
      return NextResponse.json({ message: 'Invalid activation code' }, { status: 400 });
    }

    if (dbCode.status !== 'UNUSED') {
      return NextResponse.json(
        { message: `Activation code is already ${dbCode.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (dbCode.expirationDate && new Date(dbCode.expirationDate) < new Date()) {
      return NextResponse.json({ message: 'Activation code has expired' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[AUTH DEBUG] Password hashed for user:', email);
    const referralCode = await generateUniqueReferralCode(prisma);

    let result;
    try {
      result = await prisma.$transaction(
        async (tx) => {
          const now = new Date();

          // 1. Create User
          const createdUser = await tx.user.create({
            data: {
              name: `${firstName} ${lastName}`,
              email,
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
          let sponsorPath = '';
          let sponsorDepth = 0;
          if (sponsorId) {
            const sponsorUser = await tx.user.findUnique({
              where: { id: sponsorId },
              select: { path: true, depth: true },
            });
            if (sponsorUser) {
              sponsorPath = sponsorUser.path || `root/${sponsorId}`;
              sponsorDepth = sponsorUser.depth || 0;
            }
          }
          const userPath = sponsorId
            ? `${sponsorPath}/${createdUser.id}`
            : `root/${createdUser.id}`;
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
              firstName,
              lastName,
              phone: phone || '',
            },
          });

          // 3. Guarded activation code redemption
          // Activation code is always present (required above)
          {
            const redeemResult = await tx.activationCode.updateMany({
              where: {
                id: dbCode.id,
                code: codeToValidate,
                status: 'UNUSED',
                redeemedBy: null,
                OR: [{ expirationDate: null }, { expirationDate: { gt: now } }],
              },
              data: {
                status: 'USED',
                redeemedBy: createdUser.id,
                redeemedDate: now,
              },
            });

            if (redeemResult.count !== 1) {
              throw new Error('Invalid or already used activation code.');
            }

            // 3.1 Distribute multi-level commission
            const { distributeMultiLevelCommission } = await import('@/lib/wallet/service');
            await distributeMultiLevelCommission(tx, {
              buyerId: createdUser.id,
              amountPerLevel: [10000, 5000, 3000, 1000, 1000],
              orderId: dbCode.id,
              description: `Activation Commission for User ${createdUser.id}`,
            });
          }

          // 4. MLM Placement Logic
          let placement = null;
          if (MLM_EVENT_MODE) {
            // GREEN MODE: Emit event, respond instantly
            await emitOutboxEvent(
              tx,
              'MLM_DEFERRED_OPERATION',
              createdUser.id,
              {
                source: 'register',
                originalFunction: 'spilloverSearch',
                sponsorId,
                preferredPosition: autoCalculatedPosition,
              },
              `reg_spillover_${createdUser.id}`
            );
          } else {
            // BLUE MODE (LEGACY): Block request, calculate synchronously
            if (LEGACY_WRITE_DISABLED) {
              throw new Error('Legacy financial writes disabled');
            }
            placement = await executePlacementWithTx(tx, {
              sponsorId,
              preferredPosition: autoCalculatedPosition as BinaryPosition,
              userId: createdUser.id,
            });
          }

          // 5. Log standard successful USER_REGISTER audit event
          await tx.auditLog.create({
            data: {
              adminId: createdUser.id,
              action: 'USER_REGISTER',
              targetType: 'User',
              targetId: createdUser.id,
              details: `User registered successfully: ${createdUser.email}`,
              ipAddress,
              userAgent: req.headers.get('user-agent') || null,
            },
          });

          console.log(
            '[AUTH DEBUG] User created and placed successfully in database:',
            createdUser.id
          );
          return { user: createdUser, placement };
        },
        {
          timeout: 20000, // 20s timeout safety for user creation
        }
      );
    } catch (createError: any) {
      console.error('Base user creation failed:', createError);
      if (
        createError.code === 'P2002' &&
        Array.isArray(createError.meta?.target) &&
        createError.meta.target.includes('email')
      ) {
        return NextResponse.json(
          { message: 'An account with this email already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          message:
            createError.message ||
            'Database is busy. Base user account creation failed. Please try again.',
        },
        { status: 500 }
      );
    }

    const placementResult = result.placement;
    const user = result.user;

    return NextResponse.json(
      {
        message: placementResult
          ? 'Registration successful'
          : 'Registration successful (Placement Pending)',
        user: {
          ...user,
          placement: placementResult
            ? {
                userId: placementResult.userId,
                placementId: placementResult.placementId,
                parentId: placementResult.parentId,
                binaryPosition: placementResult.binaryPosition,
                depth: placementResult.depth,
              }
            : null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('SIGNUP END (FAILED) - Registration error:', error);

    if (
      error.code === 'P1001' ||
      error.message?.includes('timeout') ||
      error.message?.includes("Can't reach database")
    ) {
      return NextResponse.json(
        { message: 'Service is experiencing high load. Please try again.' },
        { status: 503 }
      );
    }

    console.error('[AUTH DEBUG] Registration failed with error:', error);
    return NextResponse.json(
      { message: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  } finally {
    console.log('SIGNUP END - Request finalized');
  }
}
