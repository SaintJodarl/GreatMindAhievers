import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// GET support ticket messages
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;

    // Verify ticket ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized access to ticket' }, { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Fetch ticket details error:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch ticket details' },
      { status: 500 }
    );
  }
}

// POST Add reply to ticket
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const userId = session.user.id;
    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    // Verify ticket ownership
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.userId !== userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Insert ticket message and update ticket timestamp
    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: userId,
          message: message.trim(),
        },
      });

      // Optionally update status to OPEN if closed/resolved and user posts a new reply
      const updateData: any = {
        updatedAt: new Date(),
      };
      if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') {
        updateData.status = 'OPEN';
      }

      await tx.ticket.update({
        where: { id },
        data: updateData,
      });

      return msg;
    });

    return NextResponse.json(
      {
        message: 'Reply sent successfully',
        newMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Post ticket reply error:', error);
    return NextResponse.json({ message: error.message || 'Failed to send reply' }, { status: 500 });
  }
}
