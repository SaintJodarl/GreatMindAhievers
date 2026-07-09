import React from 'react';
import AuthPageClient from './components/AuthPageClient';

export default async function SignUpLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; ref?: string; sponsor?: string }>;
}) {
  const params = await searchParams;
  const isRegisterMode = params?.mode === 'register' || !!params?.ref || !!params?.sponsor;
  return <AuthPageClient defaultMode={isRegisterMode ? 'register' : 'login'} />;
}
