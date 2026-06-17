import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

// GET: List all welcome messages
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const messages = await prisma.welcomeMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('List welcome messages error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new welcome message
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { subject, content, isActive = true } = body;

    if (!subject || !content) {
      return NextResponse.json({ message: 'Subject and content are required' }, { status: 400 });
    }

    const message = await prisma.welcomeMessage.create({
      data: {
        subject,
        content,
        isActive,
      },
    });

    // Log to Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'CREATE_WELCOME_MESSAGE',
        targetType: 'WelcomeMessage',
        targetId: message.id,
        details: `Created welcome message: ${subject}`,
      },
    });

    return NextResponse.json(
      {
        message: 'Welcome message created successfully',
        messageRecord: message,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create welcome message error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
