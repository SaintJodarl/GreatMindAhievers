import { SignJWT, jwtVerify } from 'jose';

const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production.');
}

const JWT_SECRET = new TextEncoder().encode(
  secret || 'gma-dev-secret-key-change-in-development'
);

export interface TokenPayload {
  sub: string;
  role: string;
  status: string;
  onboardingStatus: string;
  sessionVersion: number;
  [key: string]: any;
}

/**
 * Signs a short-lived access token JWT (15 minutes).
 */
export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

/**
 * Verifies a token JWT and returns the parsed payload, or null if invalid/expired.
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}