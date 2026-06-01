import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, registrationCode, uplineId, position } = await req.json();

    if (!email || !password || !registrationCode) {
      return NextResponse.json(
        { message: 'Email, password, and registration code are required' },
        { status: 400 }
      );
    }

    // Validate registration code
    const code = await prisma.adminCode.findUnique({
      where: { code: registrationCode },
    });

    if (!code) {
      return NextResponse.json(
        { message: 'Invalid registration code' },
        { status: 400 }
      );
    }

    if (code.type !== 'REGISTRATION') {
      return NextResponse.json(
        { message: 'This code is not a registration code' },
        { status: 400 }
      );
    }

    if (code.status !== 'UNUSED') {
      return NextResponse.json(
        { message: 'This registration code has already been used or revoked' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { message: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Validate upline if provided
    if (uplineId) {
      const upline = await prisma.user.findUnique({
        where: { id: uplineId },
      });
      if (!upline || upline.status !== 'ACTIVE') {
        return NextResponse.json(
          { message: 'Invalid or inactive upline' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and mark code as used in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'User',
          status: 'PENDING',
          uplineId: uplineId || null,
          position: position || null,
        },
      });

      await tx.adminCode.update({
        where: { code: registrationCode },
        data: {
          status: 'USED',
          usedById: newUser.id,
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: 'Registration successful. Please sign in and complete KYC verification.' },
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
