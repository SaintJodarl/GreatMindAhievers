import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';

export async function PATCH(
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

    const adminUser = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN',
      },
    });

    if (!adminUser) {
      return NextResponse.json({ message: 'Admin user not found' }, { status: 404 });
    }

    const body = await req.json();
    const { adminRole, status } = body;

    const updateData: any = {};
    if (adminRole !== undefined) {
      // Verify role exists
      const roleExists = await prisma.adminRole.findUnique({
        where: { name: adminRole },
      });
      if (!roleExists) {
        return NextResponse.json(
          { message: 'Target adminRole configuration not found' },
          { status: 400 }
        );
      }
      updateData.adminRole = adminRole;
    }

    if (status !== undefined) {
      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
        return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
      }
      updateData.status = status;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        status: true,
        createdAt: true,
      },
    });

    // Log to Audit logs
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'UPDATE_ADMIN_USER_ROLE',
        targetType: 'User',
        targetId: id,
        details: `Updated admin user ${adminUser.email} role parameters: ${JSON.stringify(updateData)}`,
      },
    });

    return NextResponse.json({
      message: 'Admin user successfully updated',
      admin: updated,
    });
  } catch (error: any) {
    console.error('Update admin user role error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
