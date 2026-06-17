import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

// GET User tickets (with pagination)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const totalCount = await prisma.ticket.count({
      where: { userId },
    });

    const tickets = await prisma.ticket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      tickets,
      totalCount,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Fetch tickets error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST Create new support ticket
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { subject, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ message: 'Subject and message are required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          userId,
          subject: subject.trim(),
          status: 'OPEN',
        },
      });

      // Create initial message
      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: userId,
          message: message.trim(),
        },
      });

      return ticket;
    });

    return NextResponse.json(
      {
        message: 'Support ticket created successfully',
        ticket: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
