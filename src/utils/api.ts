// Frontend only (Vite). Do NOT import this in the backend.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function ensureBase() {
  if (!BASE) {
    // Fail loudly in prod if the base is missing.
    throw new Error('VITE_API_URL missing at build time');
  }
}

export async function postJson<T>(path: string, body: unknown, init: RequestInit = {}) {
  ensureBase();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    body: JSON.stringify(body),
    // add credentials: 'include' only if you truly use cookies
    ...init,
  });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${res.status} ${text.slice(0,120)}`);
  }
  return res.json() as Promise<T>;
}
