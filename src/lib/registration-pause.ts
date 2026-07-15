export const REGISTRATION_PAUSED_MESSAGE =
  'New registrations are briefly unavailable while we complete a system update. Please sign in if you already have an account, or check back shortly.';

export interface RegistrationPauseDecision {
  status: 503;
  message: string;
  code: 'REGISTRATION_PAUSED';
}

type RegistrationPauseEnv = {
  REGISTRATION_PAUSED?: string;
};

function getDefaultEnv(): RegistrationPauseEnv {
  return { REGISTRATION_PAUSED: process.env.REGISTRATION_PAUSED };
}

export function isRegistrationPaused(env: RegistrationPauseEnv = getDefaultEnv()): boolean {
  return env.REGISTRATION_PAUSED === 'true';
}

export function getRegistrationPauseDecision(
  env: RegistrationPauseEnv = getDefaultEnv()
): RegistrationPauseDecision | null {
  if (!isRegistrationPaused(env)) return null;

  return {
    status: 503,
    message: REGISTRATION_PAUSED_MESSAGE,
    code: 'REGISTRATION_PAUSED',
  };
}

export async function runWhenRegistrationOpen<T>(
  operation: () => Promise<T> | T,
  env: RegistrationPauseEnv = getDefaultEnv()
): Promise<
  { paused: true; decision: RegistrationPauseDecision } | { paused: false; result: Awaited<T> }
> {
  const decision = getRegistrationPauseDecision(env);
  if (decision) {
    return { paused: true, decision };
  }

  return { paused: false, result: await operation() };
}
