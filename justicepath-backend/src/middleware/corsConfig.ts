import type { RequestHandler } from 'express';
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

// --------- Allow rules / envs ----------
const ABSOLUTE = new Set(parseAllowlist(process.env.CORS_ALLOWLIST_JSON)); // JSON array of absolute origins
const BASE_DOMAINS = ['justicepathlaw.com'];                                // apex + subdomains always OK in prod
const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

// Cloud Run / Railway host patterns (broad but safe)
const CLOUD_RUN_REGEX = /^https:\/\/[a-z0-9-]+\.a\.run\.app$/i;
const RAILWAY_REGEX   = /^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i;

// Optional exact Cloud Run frontend origin (if you set it)
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || '').trim();
const FRONTEND_HOST   = FRONTEND_ORIGIN ? hostFrom(FRONTEND_ORIGIN) : '';

// Optional CSV of extra absolute origins (e.g., FRONTEND_URL="https://foo,https://bar")
const EXTRA_ABSOLUTE = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// --------- CORS options (no throws) ----------
export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // No Origin -> non-browser tools; skip CORS reflect without error
    if (!origin) return cb(null, false);

    const O = normalize(origin);
    const H = hostFrom(O);

    if (process.env.DEBUG_CORS === '1') {
      console.log('[CORS-check]', {
        origin: O, host: H, isDev,
        envAllow: [...ABSOLUTE], base: BASE_DOMAINS,
        FRONTEND_HOST, EXTRA_ABSOLUTE
      });
    }

    // Dev: allow everything (keeps local dev stable)
    if (isDev) return cb(null, true);

    // Prod checks (additive)
    if (ABSOLUTE.has(O)) return cb(null, true);
    if (EXTRA_ABSOLUTE.includes(O)) return cb(null, true);
    if (FRONTEND_HOST && H === FRONTEND_HOST) return cb(null, true);
    if (CLOUD_RUN_REGEX.test(O)) return cb(null, true);
    if (RAILWAY_REGEX.test(O))   return cb(null, true);
    if (H && BASE_DOMAINS.some(d => hostMatchesDomain(H, d))) return cb(null, true);

    if (process.env.DEBUG_CORS === '1') console.warn('[CORS-deny]', { origin: O });
    // IMPORTANT: never pass an Error here — that’s what 500s your OPTIONS
    return cb(null, false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Make preflight always allow bearer/cookie flows & typical AJAX headers
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],

  // Let the client read these if needed
  exposedHeaders: ['Content-Length', 'Content-Disposition'],

  optionsSuccessStatus: 204,
};

// Raw cors() (no wrapper)
export const corsMiddleware = cors(corsOptions);

/**
 * safeCors — wraps cors() so a denied/errored preflight NEVER becomes a 500.
 * - OPTIONS: returns 204 even if origin is denied (browser sees clean preflight)
 * - non-OPTIONS: returns 403 when denied (clear signal without crashing)
 */
export const safeCors: RequestHandler = (req, res, next) => {
  corsMiddleware(req, res, (err?: any) => {
    if (!err) return next();

    const origin = req.get('Origin') || '';
    console.error('[CORS blocked]', {
      origin, method: req.method, path: req.originalUrl,
      error: err?.message || String(err)
    });

    if (req.method === 'OPTIONS') {
      res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      return res.sendStatus(204);
    }
    return res.status(403).send('CORS blocked');
  });
};

// Default export = safe wrapper (so your existing import keeps working)
export default safeCors;
