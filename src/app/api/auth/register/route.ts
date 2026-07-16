import { MLM_EVENT_MODE, LEGACY_WRITE_DISABLED } from '@/lib/env';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { generateUniqueReferralCode } from '@/lib/referral-code';
import { generateReferralLink } from '@/lib/referral-link';
import { executePlacementWithTx } from '@/lib/binary-placement/utils';
import { BinaryPosition } from '@/lib/binary-placement/constants';
import { emitOutboxEvent } from '@/lib/events/outbox';
import { signAccessToken } from '@/lib/auth/jwt';
import { getRegistrationPauseDecision } from '@/lib/registration-pause';
import { STAGE_IDS } from '@/lib/qualification/constants';

export const maxDuration = 60; // Allow enough time for Neon cold starts and MLM placement

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'];
const FIRST_PARENT_BOOTSTRAP_REFERRAL_CODE = 'ROOT-PARENT-001';
const PROTECTED_ADMIN_EMAIL_LIST = [
  'makatablessing2026@gmail.com',
  'gmanetworkng@gmail.com',
  'stellarmediang@gmail.com',
] as const;
const PROTECTED_ADMIN_EMAILS = new Set<string>(PROTECTED_ADMIN_EMAIL_LIST);

const cleanRequiredText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function POST(req: NextRequest) {
  console.log('[AUTH DEBUG] Registration started');
  const pauseDecision = getRegistrationPauseDecision();
  if (pauseDecision) {
    return NextResponse.json(
      { message: pauseDecision.message, code: pauseDecision.code },
      { status: pauseDecision.status }
    );
  }

  try {
    const body = await req.json();
    const { password, sponsorCode, activationCode, registrationCode } = body;
    let { firstName, lastName, email, username, phone } = body;

    // KYC Fields
    const gender = cleanRequiredText(body.gender);
    const address = cleanRequiredText(body.address);
    const state = cleanRequiredText(body.state);

    // Banking Fields
    const bankName = cleanRequiredText(body.bankName);
    const accountNumber = cleanRequiredText(body.accountNumber);
    const accountName = cleanRequiredText(body.accountName);

    // Basic required fields check
    if (!email || !password || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { message: 'First name, last name, phone, email, and password are required' },
        { status: 400 }
      );
    }

    // KYC required fields check
    if (!gender || !address || !state) {
      return NextResponse.json(
        {
          message: 'All KYC fields (gender, address, state) are required',
        },
        { status: 400 }
      );
    }

    // Banking required fields check
    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { message: 'All banking fields (bankName, accountNumber, accountName) are required' },
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

    if (gender !== 'Male' && gender !== 'Female') {
      return NextResponse.json(
        { message: 'Gender must be either Male or Female.' },
        { status: 400 }
      );
    }

    // Check unique email
    const exists = await prisma.user.findUnique({
      where: { email },
      select: { email: true, role: true },
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

    const normalizedSponsorCode =
      typeof sponsorCode === 'string' && sponsorCode.trim() ? sponsorCode.trim().toUpperCase() : '';
    const normalMemberBootstrapWhere = {
      role: 'MEMBER',
      NOT: { email: { in: [...PROTECTED_ADMIN_EMAIL_LIST] } },
    };

    // Sponsor validation - the one-time root bootstrap code is allowed only before
    // any normal member exists.
    if (!normalizedSponsorCode) {
      return NextResponse.json(
        { message: 'A sponsor / referral code is required to register.' },
        { status: 400 }
      );
    }

    let sponsorId: string | null = null;
    let autoCalculatedPosition: 'LEFT' | 'RIGHT' = 'LEFT';
    const isFirstParentBootstrap = normalizedSponsorCode === FIRST_PARENT_BOOTSTRAP_REFERRAL_CODE;

    const existingNormalMemberCount = await prisma.user.count({
      where: {
        role: 'MEMBER',
        NOT: { email: { in: [...PROTECTED_ADMIN_EMAIL_LIST] } },
      },
    });

    if (isFirstParentBootstrap) {
      if (existingNormalMemberCount > 0) {
        return NextResponse.json(
          {
            message:
              'The first-parent bootstrap referral code has already been used. Please use a member referral code.',
          },
          { status: 400 }
        );
      }
    } else {
      const sponsor = await prisma.user.findUnique({
        where: { referralCode: normalizedSponsorCode },
        select: {
          id: true,
          email: true,
          role: true,
          preferredPosition: true,
        },
      });

      if (
        !sponsor ||
        sponsor.role !== 'MEMBER' ||
        (sponsor.email && PROTECTED_ADMIN_EMAILS.has(sponsor.email.toLowerCase()))
      ) {
        return NextResponse.json(
          { message: 'Sponsor / referral code is invalid' },
          { status: 400 }
        );
      }

      sponsorId = sponsor.id;
      autoCalculatedPosition = sponsor.preferredPosition === 'RIGHT' ? 'RIGHT' : 'LEFT';
    }

    // Activation code validation
    const rawCode = activationCode || registrationCode;
    const codeToValidate =
      typeof rawCode === 'string' && rawCode.trim() ? rawCode.trim().toUpperCase() : null;

    if (!codeToValidate) {
      return NextResponse.json(
        { message: 'Activation code is required to complete registration' },
        { status: 400 }
      );
    }

    if (!/^GMA-\d{6}$/.test(codeToValidate!)) {
      return NextResponse.json(
        { message: 'Invalid activation code format. Required format: GMA-123456' },
        { status: 400 }
      );
    }

    const dbCode = await prisma.activationCode.findUnique({
      where: { code: codeToValidate! },
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
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const referralCode = await generateUniqueReferralCode(prisma);
    const referralLink = generateReferralLink(referralCode);

    let result;
    try {
      result = await prisma.$transaction(
        async (tx) => {
          const now = new Date();

          // 1. Create User
          if (isFirstParentBootstrap) {
            await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('gma:first-parent-bootstrap'))`;

            const [transactionNormalMemberCount, existingRootNode, bootstrapReferralOwner] =
              await Promise.all([
                tx.user.count({ where: normalMemberBootstrapWhere }),
                tx.binaryTree.findFirst({
                  where: {
                    parentId: null,
                    user: {
                      role: 'MEMBER',
                    },
                  },
                  select: { userId: true },
                }),
                tx.user.findUnique({
                  where: { referralCode: FIRST_PARENT_BOOTSTRAP_REFERRAL_CODE },
                  select: { id: true },
                }),
              ]);

            if (transactionNormalMemberCount > 0 || existingRootNode || bootstrapReferralOwner) {
              throw new Error(
                'The first-parent bootstrap referral code is no longer available. Please use a member referral code.'
              );
            }
          }

          const createdUser = await tx.user.create({
            data: {
              name: `${firstName} ${lastName}`,
              email,
              username: username!.toLowerCase().trim(),
              password: hashedPassword,
              role: 'MEMBER',
              status: 'ACTIVE',
              onboardingStatus: 'COMPLETE',
              onboardingStep: 4,
              kycStatus: 'COMPLETE',
              currentStage: STAGE_IDS.STARTER_ENTRY_STAGE,
              highestStage: STAGE_IDS.STARTER_ENTRY_STAGE,
              stageUpdatedAt: now,
              autoPlacement: true,
              referralCode,
              referralLink,
              sponsorId,
              bankName,
              accountNumber,
              accountName,
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
              sessionVersion: true,
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

          // 2. Create MemberProfile
          await tx.memberProfile.create({
            data: {
              userId: createdUser.id,
              firstName,
              lastName,
              phone: phone || '',
              gender,
              address,
              state,
            },
          });

          // 2.1 Create KYCSubmission
          await tx.kYCSubmission.create({
            data: {
              userId: createdUser.id,
              fullName: `${firstName} ${lastName}`,
              phone: phone || '',
              gender,
              address,
              state,
              status: 'SUBMITTED',
            },
          });

          // 3. Guarded activation code redemption
          const redeemResult = await tx.activationCode.updateMany({
            where: {
              id: dbCode!.id,
              code: codeToValidate!,
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
            orderId: dbCode!.id,
            description: `Activation Commission for User ${createdUser.id}`,
          });

          // 4. MLM Placement Logic
          let placement = null;
          if (isFirstParentBootstrap) {
            placement = await executePlacementWithTx(tx, {
              sponsorId: null,
              preferredPosition: autoCalculatedPosition as BinaryPosition,
              userId: createdUser.id,
            });
          } else if (MLM_EVENT_MODE) {
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
            if (LEGACY_WRITE_DISABLED) {
              throw new Error('Legacy financial writes disabled');
            }
            placement = await executePlacementWithTx(tx, {
              sponsorId,
              preferredPosition: autoCalculatedPosition as BinaryPosition,
              userId: createdUser.id,
            });
          }

          // 5. Log audit events
          if (ipAddress && recentSignupsCount >= 5) {
            await tx.auditLog.create({
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

          return { user: createdUser, placement };
        },
        {
          timeout: 20000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
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

    // Issue JWT immediately so user is logged in
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      status: user.status,
      onboardingStatus: user.onboardingStatus,
      sessionVersion: user.sessionVersion,
    });

    const response = NextResponse.json(
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

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    return response;
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

    return NextResponse.json(
      { message: error.message || 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
