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
    const level = parseInt(searchParams.get('level') || '1');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (level < 1) {
      return NextResponse.json({ error: 'Level must be >= 1' }, { status: 400 });
    }

    const userBinaryTree = await prisma.binaryTree.findUnique({
      where: { userId },
    });

    if (!userBinaryTree) {
      return NextResponse.json({
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const depth = level;
    const pathPrefix = userBinaryTree.path;

    const where = {
      depth: depth,
      path: { startsWith: pathPrefix + '/' },
    };

    const [binaryNodes, total] = await Promise.all([
      prisma.binaryTree.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
              binaryPosition: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.binaryTree.count({ where }),
    ]);

    const users = binaryNodes.map((node) => ({
      id: node.user.id,
      name: node.user.name || 'Unknown',
      email: node.user.email || '',
      position: node.user.binaryPosition || 'N/A',
      status: node.user.status || 'PENDING',
      depth: node.depth,
      path: node.path,
      joinedAt: node.user.createdAt.toISOString(),
    }));

    return NextResponse.json({
      users,
      level,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Level explorer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
