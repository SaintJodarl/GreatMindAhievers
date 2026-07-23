import React from 'react';
import type { Metadata } from 'next';
import { createPrivatePageMetadata } from '@/lib/seo';
import AdminDashboardShell from './AdminDashboardShell';

export const metadata: Metadata = createPrivatePageMetadata(
  'Admin Dashboard',
  'Private Great Mind Achievers administration area.'
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
