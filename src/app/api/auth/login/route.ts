import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { signAccessToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // 1. FAIL FAST: If DB connection is saturated, reject in 2.5s instead of hanging
    const dbTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 2500)
    );
    
    const userLookup = prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    let user;
    try {
      user = await Promise.race([userLookup, dbTimeout]) as any;
    } catch (error: any) {
      if (error.message === 'DB_TIMEOUT') {
        return NextResponse.json({ message: 'Service experiencing high load. Please try again in a few seconds.' }, { status: 503 });
      }
      throw error;
    }

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // Verify account status
    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ message: 'Account suspended. Please contact support.' }, { status: 403 });
    }

    // Verify password
    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    // 1. Generate short-lived Access Token (JWT)
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      status: user.status,
      onboardingStatus: user.onboardingStatus,
    });

    // 2. Generate long-lived Refresh Token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();

    // 3 & 4. Store Refresh Token and AuditLog in a single transaction
    await prisma.$transaction([
      prisma.refreshToken.create({
        data: {
          userId: user.id,
          tokenHash,
          familyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        },
      }),
      prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: 'USER_LOGIN',
          targetType: 'User',
          targetId: user.id,
          details: `User logged in successfully: ${user.email}`,
          ipAddress: req.headers.get('x-forwarded-for') || null,
          userAgent: req.headers.get('user-agent') || null,
        },
      })
    ]);

    const response = NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        onboardingStatus: user.onboardingStatus,
      },
    });

    // 5. Set Cookies
    response.cookies.set('refreshToken', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
