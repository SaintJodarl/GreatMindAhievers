export const BASE_URL = '';

let isLoggingOut = false;

export function forceLogout() {
  if (isLoggingOut || typeof window === 'undefined') return;
  
  if (window.location.pathname === '/sign-up-login-screen' || window.location.pathname === '/') {
    return; // Already on login screen or public landing page, do not refresh
  }

  isLoggingOut = true;
  // Clear cookies via server-side logout before redirecting
  fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
  window.location.href = '/sign-up-login-screen';
}

/**
 * Custom fetch client that automatically:
 * 1. Attaches the in-memory Authorization Bearer access token.
 * 2. Intercepts 401 Unauthorized responses and performs silent token refresh.
 * 3. Retries the initial failed request on successful refresh.
 */
export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // Fallback default content type
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  const finalUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

  let response = await fetch(finalUrl, finalOptions);

  // Intercept 401 Unauthorized and attempt silent refresh cleanly
  if (response.status === 401) {
    try {
      const refreshUrl = `${BASE_URL}/api/auth/refresh`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        credentials: 'include'
      });

      if (refreshRes.ok) {
        return await fetch(finalUrl, finalOptions);
      }
    } catch (err) {
      console.error(err);
    }

    forceLogout();
    return response;
  }

  return response;
}
