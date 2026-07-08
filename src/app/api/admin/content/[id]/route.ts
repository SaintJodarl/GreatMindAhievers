import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('member:read');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const content = await prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      return NextResponse.json({ message: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Get content error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT / PATCH: Update content block
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const contentExists = await prisma.content.findUnique({
      where: { id },
    });

    if (!contentExists) {
      return NextResponse.json({ message: 'Content not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, slug, body: contentBody, isPublished } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (contentBody !== undefined) updateData.body = contentBody;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updated = await prisma.content.update({
      where: { id },
      data: updateData,
    });

    // Log to Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'UPDATE_CONTENT',
        targetType: 'Content',
        targetId: id,
        details: `Updated content block: ${updated.title} (/${updated.slug})`,
      },
    });

    return NextResponse.json({
      message: 'Content updated successfully',
      content: updated,
    });
  } catch (error: any) {
    console.error('Update content error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete content block
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await verifyAdminPermission('member:write');
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const contentExists = await prisma.content.findUnique({
      where: { id },
    });

    if (!contentExists) {
      return NextResponse.json({ message: 'Content not found' }, { status: 404 });
    }

    await prisma.content.delete({
      where: { id },
    });

    // Log to Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'DELETE_CONTENT',
        targetType: 'Content',
        targetId: id,
        details: `Deleted content block: ${contentExists.title} (/${contentExists.slug})`,
      },
    });

    return NextResponse.json({
      message: 'Content deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete content error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
