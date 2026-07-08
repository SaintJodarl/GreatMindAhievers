import { getCurrentUser } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = currentUser.id;

    const submission = await prisma.kYCSubmission.findUnique({
      where: { userId },
    });

    if (!submission) {
      return NextResponse.json({ submission: null, message: 'No documents submitted yet' });
    }

    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error('KYC documents API error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch KYC documents' },
      { status: 500 }
    );
  }
}
