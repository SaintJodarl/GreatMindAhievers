export function generateReferralLink(referralCode: string): string {
  if (!referralCode) return '';

  const fallbackBase = 'https://app.greatmindachievers.org';

  let baseUrl = fallbackBase;
  if (typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  }

  // Ensure baseUrl doesn't end with a slash
  baseUrl = baseUrl.replace(/\/$/, '');

  return `${baseUrl}/sign-up-login-screen?mode=register&ref=${encodeURIComponent(referralCode)}`;
}
