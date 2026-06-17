import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export interface VerifyAdminResult {
  authorized: boolean;
  status?: number;
  message?: string;
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
    status: string;
    adminRole?: string | null;
  };
}

export async function verifyAdminPermission(
  requiredPermission?: string
): Promise<VerifyAdminResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { authorized: false, status: 401, message: 'Unauthorized' };
  }

  const userRole = session.user.role;
  const adminRoleName = session.user.adminRole;

  if (userRole !== 'ADMIN') {
    return { authorized: false, status: 403, message: 'Forbidden: Admin access only' };
  }

  // If no specific permission is required, general admin role is enough
  if (!requiredPermission) {
    return { authorized: true, user: session.user as any };
  }

  // If user has adminRole, fetch its permissions from database
  if (adminRoleName) {
    const roleRecord = await prisma.adminRole.findUnique({
      where: { name: adminRoleName },
    });

    if (!roleRecord) {
      return {
        authorized: false,
        status: 403,
        message: 'Forbidden: Admin role settings not found',
      };
    }

    const permissions: string[] = JSON.parse(roleRecord.permissions);

    if (permissions.includes('*') || permissions.includes(requiredPermission)) {
      return { authorized: true, user: session.user as any };
    }
  } else {
    // If no adminRole name, but user is ADMIN (legacy/default), give full access
    return { authorized: true, user: session.user as any };
  }

  return {
    authorized: false,
    status: 403,
    message: `Forbidden: Missing required permission: ${requiredPermission}`,
  };
}
