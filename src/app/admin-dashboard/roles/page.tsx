import { prisma } from '@/lib/prisma';
import React from 'react';
import AdminRolesClient from './components/AdminRolesClient';

export const metadata = {
  title: 'Admin Roles | Admin',
};

export default async function RolesPage() {
  const [admins, roles] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminRole.findMany(),
  ]);

  // Serialize date fields for Client Component compatibility
  const serializedAdmins = admins.map((admin) => ({
    ...admin,
    createdAt: admin.createdAt.toISOString(),
    updatedAt: admin.updatedAt.toISOString(),
  }));

  const serializedRoles = roles.map((role) => ({
    ...role,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }));

  return <AdminRolesClient initialAdmins={serializedAdmins as any} roles={serializedRoles as any} />;
}

