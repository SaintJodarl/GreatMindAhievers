let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = () => {
  return inMemoryToken;
};

/**
 * Custom fetch client that automatically:
 * 1. Attaches the in-memory Authorization Bearer access token.
 * 2. Intercepts 401 Unauthorized responses and performs silent token refresh.
 * 3. Retries the initial failed request on successful refresh.
 */
export async function api(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  if (inMemoryToken) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  // Fallback default content type
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(url, finalOptions);

  // Intercept 401 Unauthorized and try refreshing token
  if (response.status === 401) {
    try {
      const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
      
      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json();
        setAccessToken(accessToken);

        // Update authorization header and retry original request
        headers.set('Authorization', `Bearer ${accessToken}`);
        response = await fetch(url, finalOptions);
      } else {
        setAccessToken(null);
      }
    } catch (err) {
      console.error('Silent token refresh error in client request:', err);
      setAccessToken(null);
    }
  }

  return response;
}
