import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const message = await prisma.welcomeMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return NextResponse.json({ message: 'Welcome message not found' }, { status: 404 });
    }

    return NextResponse.json({ messageRecord: message });
  } catch (error: any) {
    console.error('Get welcome message error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT / PATCH: Update welcome message
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const messageExists = await prisma.welcomeMessage.findUnique({
      where: { id },
    });

    if (!messageExists) {
      return NextResponse.json({ message: 'Welcome message not found' }, { status: 404 });
    }

    const body = await req.json();
    const { subject, content, isActive } = body;

    const updateData: any = {};
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.welcomeMessage.update({
      where: { id },
      data: updateData,
    });

    // Log to Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'UPDATE_WELCOME_MESSAGE',
        targetType: 'WelcomeMessage',
        targetId: id,
        details: `Updated welcome message: ${updated.subject}`,
      },
    });

    return NextResponse.json({
      message: 'Welcome message updated successfully',
      messageRecord: updated,
    });
  } catch (error: any) {
    console.error('Update welcome message error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete welcome message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const messageExists = await prisma.welcomeMessage.findUnique({
      where: { id },
    });

    if (!messageExists) {
      return NextResponse.json({ message: 'Welcome message not found' }, { status: 404 });
    }

    await prisma.welcomeMessage.delete({
      where: { id },
    });

    // Log to Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'DELETE_WELCOME_MESSAGE',
        targetType: 'WelcomeMessage',
        targetId: id,
        details: `Deleted welcome message: ${messageExists.subject}`,
      },
    });

    return NextResponse.json({
      message: 'Welcome message deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete welcome message error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
