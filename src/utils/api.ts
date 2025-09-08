// src/utils/api.ts
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Example call:
export async function login(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // only if you actually use cookies
  });

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Unexpected response: ${res.status} ${text.slice(0,120)}`);
  }
  return res.json();
}
