import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ message: 'Missing access token' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ message: 'Invalid or expired access token' }, { status: 401 });
    }

    // Fetch user details from database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json({ message: 'Account suspended' }, { status: 403 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Fetch me profile error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
