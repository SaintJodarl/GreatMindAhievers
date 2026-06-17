import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { preferredPosition: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ preferredPosition: user.preferredPosition });
  } catch (error: any) {
    console.error('Fetch placement error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { preferredPosition } = await req.json();

    if (!preferredPosition || !['LEFT', 'RIGHT'].includes(preferredPosition)) {
      return NextResponse.json(
        { message: 'preferredPosition must be LEFT or RIGHT' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: { preferredPosition },
      select: { preferredPosition: true },
    });

    return NextResponse.json({
      message: 'Placement position settings updated successfully',
      preferredPosition: updatedUser.preferredPosition,
    });
  } catch (error: any) {
    console.error('Update placement error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
