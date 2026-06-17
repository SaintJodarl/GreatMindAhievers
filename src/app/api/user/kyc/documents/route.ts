import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

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
