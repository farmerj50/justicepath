// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// --- Dev allowlist (unchanged) ---
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// --- Existing Railway support (kept) ---
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'justicepath-production';
const PROD_REGEX = new RegExp(
  `^https://${FRONTEND_BASE}(-[a-z0-9]+)?\\.up\\.railway\\.app$`
);

// --- Helpers ---
const normalize = (s: string) => (s || '').replace(/\/$/, '').toLowerCase();
const hostFrom = (u: string) => {
  try { return new URL(u).hostname.toLowerCase(); } catch { return ''; }
};
const hostMatchesDomain = (originHost: string, domain: string) =>
  originHost === domain || originHost.endsWith('.' + domain);

// --- Single/primary origins ---
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '';
const FRONTEND_HOST   = hostFrom(FRONTEND_ORIGIN);

// --- CSV domains: accept either bare domains or full URLs; convert to hostnames ---
const FRONTEND_DOMAINS: string[] = (process.env.FRONTEND_DOMAINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(s => hostFrom(s) || s.toLowerCase());

// --- Absolute origins (exact string compare; normalized) ---
const csv = (v?: string) =>
  (v || '')
    .split(',')
    .map(s => normalize(s.trim()))
    .filter(Boolean);

// Single values + CSVs we’ll treat as absolute origins:
const ABSOLUTE_ORIGINS = new Set<string>([
  ...csv(process.env.FRONTEND_URL),
  ...csv(process.env.FRONTEND_ORIGIN), // in case someone set multiple
  ...csv(process.env.CLIENT_ORIGIN),
  ...csv(process.env.ALLOWED_ORIGINS),
]);

// Optional JSON array of absolute origins:
try {
  const arr = JSON.parse(process.env.CORS_ALLOWLIST_JSON || '[]');
  if (Array.isArray(arr)) {
    for (const x of arr) {
      if (typeof x === 'string' && x.trim()) ABSOLUTE_ORIGINS.add(normalize(x));
    }
  }
} catch { /* ignore */ }

// --- Cloud Run web host safety net (now actually used) ---
const CLOUD_RUN_WEB_REGEX = /^https:\/\/justicepath-web-[a-z0-9-]+\.a\.run\.app$/i;

// --- Tiny force-allow (normalized) ---
const FORCE_ALLOW = new Set<string>([
  'https://justicepath-web-qrofchwfea-ue.a.run.app',
  'https://justicepathlaw.com',
  'https://www.justicepathlaw.com',
].map(normalize));

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // allow non-browser tools (no Origin header)
    if (!origin) return cb(null, true);

    const isDev = process.env.NODE_ENV !== 'production';
    const O = normalize(origin);
    const oHost = hostFrom(origin);

    if (isDev) {
      return DEV_ORIGINS.map(normalize).includes(O)
        ? cb(null, true)
        : cb(new Error(`Not allowed by CORS (dev): ${origin}`));
    }

    if (FORCE_ALLOW.has(O)) return cb(null, true);

    const allowByRailway       = PROD_REGEX.test(origin);
    const allowByCloudRunRegex = CLOUD_RUN_WEB_REGEX.test(origin);
    const allowByExactCloudRun = FRONTEND_HOST && oHost === FRONTEND_HOST;
    const allowByDomains       = !!oHost && FRONTEND_DOMAINS.some(d => hostMatchesDomain(oHost, d));
    const allowByAbsolute      = ABSOLUTE_ORIGINS.has(O);

    const ok =
      allowByRailway ||
      allowByCloudRunRegex ||
      allowByExactCloudRun ||
      allowByDomains ||
      allowByAbsolute;

    return ok ? cb(null, true) : cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
