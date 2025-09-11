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

const ABSOLUTE = new Set(parseAllowlist(process.env.CORS_ALLOWLIST_JSON));
const BASE_DOMAINS = ['justicepathlaw.com'];
const isDevOrigin = (o: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o);
const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // No Origin (curl/Postman): skip CORS, don’t error
    if (!origin) return cb(null, false);

    const O = normalize(origin);
    const host = hostFrom(O);

    if (process.env.DEBUG_CORS === '1') {
      console.log('[CORS]', { origin, normalized: O, host, isDev, absolute: [...ABSOLUTE], base: BASE_DOMAINS });
    }

    // In dev: never block yourself
    if (isDev) return cb(null, true);

    if (isDevOrigin(O)) return cb(null, true);
    if (ABSOLUTE.has(O)) return cb(null, true);
    if (host && BASE_DOMAINS.some(d => hostMatchesDomain(host, d))) return cb(null, true);

    // In prod: deny quietly (no throw) so Express won’t 500
    return cb(null, false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // 🔑 Make preflight always allow bearer/cookie flows & typical AJAX headers
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],

  // (optional) let the client read these if needed (safe defaults)
  exposedHeaders: ['Content-Length', 'Content-Disposition'],

  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
