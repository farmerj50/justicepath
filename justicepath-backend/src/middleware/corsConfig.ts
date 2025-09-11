import type { RequestHandler } from 'express';
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const normalize = (s: string) => (s || '').replace(/\/+$/, '').toLowerCase();
const hostFrom = (u: string) => {
  try { return new URL(u).hostname.toLowerCase(); } catch { return ''; }
};
const hostMatchesDomain = (h: string, d: string) => !!h && (h === d || h.endsWith('.' + d));

function parseAllowlist(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(x => typeof x === 'string').map(normalize);
  } catch {}
  return [];
}

// your existing allow rules
const ABSOLUTE = new Set(parseAllowlist(process.env.CORS_ALLOWLIST_JSON));
const BASE_DOMAINS = ['justicepathlaw.com'];
const isDevOrigin = (o: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(o);
const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

// 🔹 Exported so you can import { corsOptions } elsewhere
export const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // No Origin (curl/Postman): skip CORS, don’t error & don’t reflect
    if (!origin) return cb(null, false);

    const O = normalize(origin);
    const host = hostFrom(O);

    if (process.env.DEBUG_CORS === '1') {
      console.log('[CORS-check]', {
        origin, normalized: O, host, isDev,
        absolute: [...ABSOLUTE], base: BASE_DOMAINS
      });
    }

    // In dev: never block localhost (keeps uploads & everything working)
    if (isDev) return cb(null, true);

    if (isDevOrigin(O)) return cb(null, true);
    if (ABSOLUTE.has(O)) return cb(null, true);
    if (host && BASE_DOMAINS.some(d => hostMatchesDomain(host, d))) return cb(null, true);

    // In prod: deny quietly so Express won't 500
    return cb(null, false);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Typical AJAX/auth headers
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],

  // Let the client read these if needed
  exposedHeaders: ['Content-Length', 'Content-Disposition'],

  optionsSuccessStatus: 204,
};

// Export the raw cors middleware too (handy for tests or special routes)
export const corsMiddleware = cors(corsOptions);

/**
 * safeCors — wraps cors() so:
 *  - a blocked preflight never becomes a 500
 *  - logs when something is denied (DEBUG_CORS=1)
 *  - other blocked requests get a clean 403
 */
export const safeCors: RequestHandler = (req, res, next) => {
  corsMiddleware(req, res, (err?: any) => {
    if (!err) return next();

    const origin = req.get('Origin') || '';
    if (process.env.DEBUG_CORS === '1' || process.env.NODE_ENV !== 'production') {
      console.error('[CORS blocked]', {
        origin,
        method: req.method,
        path: req.originalUrl,
        error: err?.message || String(err)
      });
    }

    // never 500 a preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
      return res.sendStatus(204);
    }

    return res.status(403).send('CORS blocked');
  });
};

// Default export = safe wrapper
export default safeCors;
