import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminPermission } from '@/lib/auth/admin-guard';
import bcrypt from 'bcryptjs';

// GET: List all administrators and admin role configurations
export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('admin:read'); // view admin roles
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const [admins, roles] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          adminRole: true,
          createdAt: true,
        },
      }),
      prisma.adminRole.findMany(),
    ]);

    return NextResponse.json({ admins, roles });
  } catch (error: any) {
    console.error('List admin roles error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create/Invite a new Administrator user
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('admin:write'); // edit admin roles
    if (!auth.authorized) {
      return NextResponse.json({ message: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const { name, email, password, adminRole } = body; // adminRole: SUPER_ADMIN, FINANCE_ADMIN, etc.

    if (!email || !password || !adminRole) {
      return NextResponse.json(
        { message: 'Email, password, and adminRole are required' },
        { status: 400 }
      );
    }

    // Verify adminRole is valid
    const roleExists = await prisma.adminRole.findUnique({
      where: { name: adminRole },
    });

    if (!roleExists) {
      return NextResponse.json(
        { message: 'Target adminRole configuration not found' },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        adminRole,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        adminRole: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await prisma.user.update({
      where: { id: newAdmin.id },
      data: {
        path: `root/${newAdmin.id}`,
        depth: 0,
      },
    });

    // Log to Audit logs
    await prisma.auditLog.create({
      data: {
        adminId: auth.user!.id,
        action: 'INVITE_ADMIN_USER',
        targetType: 'User',
        targetId: newAdmin.id,
        details: `Invited/Created admin user: ${email} with role ${adminRole}`,
      },
    });

    return NextResponse.json(
      {
        message: 'Admin user successfully created',
        admin: newAdmin,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create admin role user error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
