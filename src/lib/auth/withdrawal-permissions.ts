import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth/session';

export interface VerifyWithdrawalPermissionResult {
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

export async function verifyWithdrawalPermission(
  requiredPermission: 'withdrawal:read' | 'withdrawal:write'
): Promise<VerifyWithdrawalPermissionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return { authorized: false, status: 401, message: 'Unauthorized' };
  }

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

  if (dbUser.role === 'SUPER_ADMIN') {
    return { authorized: true, user: dbUser };
  }

  if (!['ADMIN', 'SUPPORT'].includes(dbUser.role)) {
    return { authorized: false, status: 403, message: 'Forbidden: Admin access only' };
  }

  if (!dbUser.adminRole) {
    return {
      authorized: false,
      status: 403,
      message: 'Forbidden: Withdrawal permissions require an assigned admin role',
    };
  }

  const roleRecord = await prisma.adminRole.findUnique({
    where: { name: dbUser.adminRole },
    select: { permissions: true },
  });

  if (!roleRecord) {
    return {
      authorized: false,
      status: 403,
      message: 'Forbidden: Admin role settings not found',
    };
  }

  let permissions: string[];
  try {
    permissions = JSON.parse(roleRecord.permissions) as string[];
  } catch {
    return {
      authorized: false,
      status: 403,
      message: 'Forbidden: Admin role permissions are invalid',
    };
  }

  if (!Array.isArray(permissions)) {
    return {
      authorized: false,
      status: 403,
      message: 'Forbidden: Admin role permissions are invalid',
    };
  }
  if (permissions.includes('*') || permissions.includes(requiredPermission)) {
    return { authorized: true, user: dbUser };
  }

  return {
    authorized: false,
    status: 403,
    message: `Forbidden: Missing required permission: ${requiredPermission}`,
  };
}
