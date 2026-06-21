import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { signAccessToken } from '@/lib/auth/jwt';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (error: any) {
      console.error('Login DB error:', error);
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


    // 2. Generate long-lived Refresh Token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
    const familyId = crypto.randomUUID();

    // 3 & 4. Store Refresh Token, AuditLog, and update User Session Version in a single transaction
    const newSessionVersion = user.sessionVersion + 1;
    
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { sessionVersion: newSessionVersion }
      }),
      prisma.refreshToken.deleteMany({
        where: { userId: user.id }
      }),
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

    // 1. Generate short-lived Access Token (JWT)
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      status: user.status,
      onboardingStatus: user.onboardingStatus,
      sessionVersion: newSessionVersion,
    });

    const response = NextResponse.json({
      message: 'Login successful',
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
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
