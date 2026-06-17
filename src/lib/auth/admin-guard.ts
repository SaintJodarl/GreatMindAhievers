import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

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
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return { authorized: false, status: 401, message: 'Unauthorized' };
  }

  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    return { authorized: false, status: 403, message: 'Forbidden: Admin access only' };
  }

  // Fetch the fresh user details and permissions context from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      adminRole: true,
    },
  });

  if (!dbUser) {
    return { authorized: false, status: 401, message: 'Unauthorized: User not found' };
  }

  if (dbUser.status === 'SUSPENDED') {
    return { authorized: false, status: 403, message: 'Forbidden: Account suspended' };
  }

  // If no specific permission is required, general admin role is enough
  if (!requiredPermission) {
    return { authorized: true, user: dbUser as any };
  }

  // If user has adminRole, fetch its permissions from database
  if (dbUser.adminRole) {
    const roleRecord = await prisma.adminRole.findUnique({
      where: { name: dbUser.adminRole },
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
      return { authorized: true, user: dbUser as any };
    }
  } else {
    // If no adminRole name, but user is ADMIN (legacy/default), give full access
    return { authorized: true, user: dbUser as any };
  }

  return {
    authorized: false,
    status: 403,
    message: `Forbidden: Missing required permission: ${requiredPermission}`,
  };
}
