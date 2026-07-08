import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('support:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ message: 'Ticket not found' }, { status: 404 });
    }

    const body = await req.json();
    const { message, status = 'IN_PROGRESS' } = body;

    if (!message) {
      return NextResponse.json({ message: 'Message content is required' }, { status: 400 });
    }

    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Ticket Message
      const newMessage = await tx.ticketMessage.create({
        data: {
          ticketId: id,
          senderId: auth.user!.id,
          message,
        },
      });

      // 2. Update Ticket Status
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      // 3. Log to Audit log
      await tx.auditLog.create({
        data: {
          adminId: auth.user!.id,
          action: 'RESPOND_SUPPORT_TICKET',
          targetType: 'Ticket',
          targetId: id,
          details: `Responded to support ticket. Set status to ${status}`,
        },
      });

      return { newMessage, updatedTicket };
    });

    return NextResponse.json(
      {
        message: 'Response recorded successfully',
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Respond ticket error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
