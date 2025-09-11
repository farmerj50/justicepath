// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const normalize = (s: string) => (s || '').replace(/\/+$/, '').toLowerCase();
const hostFrom = (u: string) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const hostMatchesDomain = (h: string, d: string) => !!h && (h === d || h.endsWith('.' + d));

function parseAllowlist(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(x => typeof x === 'string').map(normalize);
  } catch {}
  return [];
}

// absolute origins (full scheme+host) from env
const ABSOLUTE = new Set(parseAllowlist(process.env.CORS_ALLOWLIST_JSON));

// base domains (host + any subdomain)
const BASE_DOMAINS = ['justicepathlaw.com'];

// dev convenience
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Allow tools without Origin (curl, Postman)
    if (!origin) {
      if (process.env.DEBUG_CORS === '1') console.log('[CORS] no origin → allow');
      return cb(null, true);
    }

    const O = normalize(origin);
    const host = hostFrom(O);

    if (process.env.DEBUG_CORS === '1') {
      console.log('[CORS] check', {
        origin,
        normalized: O,
        host,
        isDev,
        absolute: Array.from(ABSOLUTE),
        base: BASE_DOMAINS,
      });
    }

    // In dev: always allow your local Vite hosts
    if (isDev && DEV_ORIGINS.includes(O)) {
      if (process.env.DEBUG_CORS === '1') console.log('[CORS] allow dev origin');
      return cb(null, true);
    }

    // Prod allow rules
    if (ABSOLUTE.has(O)) return cb(null, true);
    if (host && BASE_DOMAINS.some(d => hostMatchesDomain(host, d))) return cb(null, true);

    // IMPORTANT: do NOT throw — deny quietly so preflight doesn't 500
    if (process.env.DEBUG_CORS === '1') console.log('[CORS] DENY', { origin, host });
    return cb(null, false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Disposition'],
  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
