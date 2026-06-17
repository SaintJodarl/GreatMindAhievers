import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

// GET: List all content blocks
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:read'); // or general admin read
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const contents = await prisma.content.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ contents });
  } catch (error: any) {
    console.error('List contents error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new content block
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('member:write'); // or admin write
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { title, slug, body: contentBody, isPublished = false } = body;

    if (!title || !slug || !contentBody) {
      return NextResponse.json({ message: 'Title, slug, and body are required' }, { status: 400 });
    }

    const slugExists = await prisma.content.findUnique({
      where: { slug },
    });

    if (slugExists) {
      return NextResponse.json({ message: 'Content slug already exists' }, { status: 400 });
    }

    const content = await prisma.content.create({
      data: {
        title,
        slug,
        body: contentBody,
        isPublished,
      },
    });

    // Log to Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'CREATE_CONTENT',
        targetType: 'Content',
        targetId: content.id,
        details: `Created content block: ${title} (/${slug})`,
      },
    });

    return NextResponse.json(
      {
        message: 'Content created successfully',
        content,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create content error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
