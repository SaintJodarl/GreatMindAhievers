import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const userBinaryTree = await prisma.binaryTree.findUnique({
      where: { userId },
    });

    if (!userBinaryTree) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { referralCode: { contains: query } },
            ],
          },
          {
            binaryTree: {
              path: { startsWith: userBinaryTree.path + '/' },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        binaryPosition: true,
        status: true,
        referralCode: true,
        binaryTree: {
          select: {
            depth: true,
            path: true,
          },
        },
      },
      take: limit,
    });

    const results = users.map((user) => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || '',
      referralCode: user.referralCode || '',
      position: user.binaryPosition || 'N/A',
      status: user.status || 'PENDING',
      depth: user.binaryTree?.depth || 0,
      path: user.binaryTree?.path || '',
    }));

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error('Network search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
