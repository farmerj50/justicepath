// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// Dev allowlist
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Helpers
const normalize = (s: string) => (s || '').replace(/\/+$/, '').toLowerCase();
const hostFrom = (u: string) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const hostMatchesDomain = (originHost: string, domain: string) =>
  originHost === domain || (!!domain && originHost.endsWith('.' + domain));

// Parse allowlist from JSON array env
function parseAllowlist(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(x => typeof x === 'string').map(normalize);
  } catch {}
  return [];
}

const ABSOLUTE_ORIGINS = new Set<string>(parseAllowlist(process.env.CORS_ALLOWLIST_JSON));
// optional: also allow subdomains of your main site
const BASE_DOMAINS = ['justicepathlaw.com'];

// Treat “dev” only if the origin is localhost (don’t hinge on NODE_ENV)
function isDevOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // Non-browser (no Origin) → don’t add CORS, but don’t error either
    if (!origin) return cb(null, false);

    const O = normalize(origin);
    const oHost = hostFrom(origin);

    // Dev localhost allowed
    if (isDevOrigin(O)) return cb(null, true);

    // Exact allowlist
    if (ABSOLUTE_ORIGINS.has(O)) return cb(null, true);

    // Base domain / subdomains
    if (oHost && BASE_DOMAINS.some(d => hostMatchesDomain(oHost, d))) {
      return cb(null, true);
    }

    // Reject *without* throwing → no 500
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);
export default corsMiddleware;