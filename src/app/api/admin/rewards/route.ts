import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

// Check if user is admin
async function isAdmin(session: any) {
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const claims = await prisma.rewardClaim.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            currentStage: true,
            bankName: true,
            accountNumber: true,
            accountName: true,
          },
        },
        reward: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(claims);
  } catch (error: any) {
    console.error('Error fetching claims:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!(await isAdmin(session))) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { claimId, status, adminNote } = await req.json();

    if (
      !claimId ||
      !['PROCESSING', 'PAID', 'FULFILLED', 'REJECTED', 'CANCELLED'].includes(status)
    ) {
      return new NextResponse('Invalid payload', { status: 400 });
    }

    const updatedClaim = await prisma.rewardClaim.update({
      where: { id: claimId },
      data: {
        status,
        adminNote,
        processedByAdminId: session!.user!.id,
        processedAt: new Date(),
      },
    });

    return NextResponse.json(updatedClaim);
  } catch (error: any) {
    console.error('Error processing claim:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
