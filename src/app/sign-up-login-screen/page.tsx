import React from 'react';
import AuthPageClient from './components/AuthPageClient';
import { getRegistrationPauseDecision } from '@/lib/registration-pause';

export default async function SignUpLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; ref?: string; sponsor?: string }>;
}) {
  const params = await searchParams;
  const isRegisterMode = params?.mode === 'register' || !!params?.ref || !!params?.sponsor;
  const registrationPause = getRegistrationPauseDecision();

  return (
    <AuthPageClient
      defaultMode={isRegisterMode ? 'register' : 'login'}
      registrationPaused={Boolean(registrationPause)}
      registrationPausedMessage={registrationPause?.message}
    />
  );
}
