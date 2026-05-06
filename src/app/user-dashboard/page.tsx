import React from 'react';
import AppLayout from '@/components/AppLayout';
import UserDashboardContent from './components/UserDashboardContent';

export default function UserDashboardPage() {
  return (
    <AppLayout role="user">
      <UserDashboardContent />
    </AppLayout>
  );
}