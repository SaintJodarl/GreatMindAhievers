import React from 'react';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import { createPrivatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPrivatePageMetadata(
  'Member Dashboard',
  'Private Great Mind Achievers member dashboard.'
);

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="user">{children}</AppLayout>;
}
