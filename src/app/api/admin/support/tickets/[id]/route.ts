import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('support:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Add message reply and optionally update ticket status
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('support:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const ticketExists = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticketExists) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    const body = await req.json();
    const { message, status } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ message: 'Message content is required' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ticket message
      const ticketMessage = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: auth.user!.id,
          message: message.trim(),
        },
      });

      // 2. Update status if specified, otherwise keep current status or move to IN_PROGRESS
      const newStatus =
        status || (ticketExists.status === 'OPEN' ? 'IN_PROGRESS' : ticketExists.status);
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          status: newStatus,
        },
      });

      // 3. Log to Audit logs
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'REPLY_SUPPORT_TICKET',
          targetType: 'Ticket',
          targetId: id,
          details: `Replied to ticket #${id.slice(0, 8)}. Status updated to ${newStatus}`,
        },
      });

      return { ticketMessage, updatedTicket };
    });

    return NextResponse.json(
      {
        message: 'Reply sent successfully',
        ticketMessage: result.ticketMessage,
        ticket: result.updatedTicket,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Reply ticket error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
