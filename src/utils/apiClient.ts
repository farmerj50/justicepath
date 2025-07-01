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
  const token = localStorage.getItem('justicepath-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const methodUpper = method.toUpperCase();
  const url =
    methodUpper === 'GET' && body
      ? `${joinUrl(API_URL, path)}${buildQuery(body)}`
      : joinUrl(API_URL, path);

  // 🔍 Debug
  console.log(`[API] ${methodUpper} ${url}`);
  if (body) console.log(`[API] Payload:`, body);

  const response = await fetch(url, {
    method: methodUpper,
    headers,
    body: methodUpper !== 'GET' && body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API ERROR] ${response.status}: ${errorText}`);
    throw new Error(errorText || `Request failed with ${response.status}`);
  }

  return response.json();
};
