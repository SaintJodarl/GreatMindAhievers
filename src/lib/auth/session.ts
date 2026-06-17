import { headers } from 'next/headers';
import { verifyAccessToken } from './jwt';

export interface AuthSessionUser {
  id: string;
  role: string;
  status: string;
  onboardingStatus: string;
}

/**
 * Retrieves the currently authenticated user from headers set by the middleware,
 * with a manual JWT token verification fallback.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const role = headersList.get('x-user-role');
  const status = headersList.get('x-user-status');
  const onboardingStatus = headersList.get('x-user-onboarding-status');

  if (userId) {
    return {
      id: userId,
      role: role || 'MEMBER',
      status: status || 'PENDING',
      onboardingStatus: onboardingStatus || 'INCOMPLETE',
    };
  }

  // Fallback: manually verify access token if headers are not set (e.g. edge routes or background services)
  const authHeader = headersList.get('authorization');
  let token = authHeader?.split(' ')[1];

  if (!token) {
    const cookieHeader = headersList.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      return {
        id: payload.sub,
        role: payload.role,
        status: payload.status,
        onboardingStatus: payload.onboardingStatus || 'INCOMPLETE',
      };
    }
  }

  return null;
}
