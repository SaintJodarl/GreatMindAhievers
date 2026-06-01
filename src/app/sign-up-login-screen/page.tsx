import React from 'react';
import AuthPageClient from './components/AuthPageClient';

export default async function SignUpLoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const params = await searchParams;
  return <AuthPageClient defaultMode={params?.mode === 'register' ? 'register' : 'login'} />;
}