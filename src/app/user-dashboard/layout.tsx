import React from 'react';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'Member Dashboard | GMA Network',
};

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout role="user">{children}</AppLayout>;
}
