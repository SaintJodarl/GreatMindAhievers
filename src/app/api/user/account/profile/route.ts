import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

// GET Profile Details
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycSubmission: {
          select: {
            phone: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      name: user.name || '',
      email: user.email || '',
      referralCode: user.referralCode || '',
      status: user.status || 'PENDING',
      phone: user.kycSubmission?.phone || '',
      bankName: user.bankName || '',
      accountNumber: user.accountNumber || '',
      accountName: user.accountName || '',
      notifyEmail: user.notifyEmail,
      notifySms: user.notifySms,
    });
  } catch (error: any) {
    console.error('Fetch profile details error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch profile details' },
      { status: 500 }
    );
  }
}

// POST Update Profile
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;
    const body = await req.json();
    const { name, phone, bankName, accountNumber, accountName, notifyEmail, notifySms } = body;

    if (!name?.trim()) {
      return NextResponse.json({ message: 'Name is required' }, { status: 400 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user details
      const usr = await tx.user.update({
        where: { id: userId },
        data: {
          name: name.trim(),
          bankName: bankName !== undefined ? bankName.trim() : undefined,
          accountNumber: accountNumber !== undefined ? accountNumber.trim() : undefined,
          accountName: accountName !== undefined ? accountName.trim() : undefined,
          notifyEmail: notifyEmail !== undefined ? !!notifyEmail : undefined,
          notifySms: notifySms !== undefined ? !!notifySms : undefined,
        },
      });

      // Update or create KYCSubmission phone
      if (phone?.trim()) {
        const kyc = await tx.kYCSubmission.findUnique({
          where: { userId },
        });

        if (kyc) {
          await tx.kYCSubmission.update({
            where: { userId },
            data: { phone: phone.trim() },
          });
        } else {
          await tx.kYCSubmission.create({
            data: {
              userId,
              fullName: name.trim(),
              phone: phone.trim(),
              address: '',
              state: '',
              lga: '',
              idType: 'NIN',
              idNumber: '',
              status: 'PENDING', // set initial status
            },
          });
        }
      }

      return usr;
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      name: updatedUser.name,
      bankName: updatedUser.bankName || '',
      accountNumber: updatedUser.accountNumber || '',
      accountName: updatedUser.accountName || '',
      notifyEmail: updatedUser.notifyEmail,
      notifySms: updatedUser.notifySms,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
