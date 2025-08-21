export const API_URL = import.meta.env.VITE_API_URL;

const buildQuery = (params: Record<string, any>): string =>
  '?' + new URLSearchParams(params).toString();

// Safely joins base URL and path with exactly one slash
const joinUrl = (base: string, path: string): string =>
  `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

export const apiRequest = async <T = any>(
  path: string,
  method: string = 'GET',
  body?: Record<string, any>,
  customHeaders: Record<string, string> = {}
): Promise<T> => {
  const makeUrl = () => {
    const methodUpper = method.toUpperCase();
    return methodUpper === 'GET' && body
      ? `${joinUrl(API_URL, path)}${buildQuery(body)}`
      : joinUrl(API_URL, path);
  };

  const doFetch = async (token?: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const methodUpper = method.toUpperCase();
    const url = makeUrl();

    // 🔍 Debug
    console.log(`[API] ${methodUpper} ${url}`);
    if (body && methodUpper !== 'GET') console.log(`[API] Payload:`, body);

    return fetch(url, {
      method: methodUpper,
      headers,
      body: methodUpper !== 'GET' && body ? JSON.stringify(body) : undefined,
      credentials: 'include', // ✅ send refresh cookie
    });
  };

  // 1st attempt with current token
  let token = localStorage.getItem('justicepath-token');
  let response = await doFetch(token);

  // If unauthorized, try to refresh once and retry
  if (response.status === 401) {
    try {
      const r = await fetch(joinUrl(API_URL, '/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include', // ✅ send jp_rt cookie
      });
      if (r.ok) {
        const data = await r.json(); // { token: "<new access>" }
        if (data?.token) {
          const fresh: string = String(data.token);
          token = fresh;
          localStorage.setItem('justicepath-token', fresh);
          response = await doFetch(fresh); // retry original call
        }
      }
    } catch (e) {
      // ignore; will fall through to error handling below
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API ERROR] ${response.status}: ${errorText}`);
    throw new Error(errorText || `Request failed with ${response.status}`);
  }

  return response.json();
};
