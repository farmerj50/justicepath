// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// --- existing Railway support (kept) ---
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'justicepath-production';
const PROD_REGEX = new RegExp(
  `^https://${FRONTEND_BASE}(-[a-z0-9]+)?\\.up\\.railway\\.app$`
);

// --- NEW: explicit frontend origin (Cloud Run URL) + domain list ---
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || ''; // e.g. https://justicepath-web-xxxx-ue.a.run.app
const FRONTEND_DOMAINS = (process.env.FRONTEND_DOMAINS || '') // e.g. "justicepathlaw.com,app.justicepathlaw.com"
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

// Optional extra absolute origins (you already had this)
const EXTRA_ORIGINS = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
  // --- ADDED: tiny hard allowlist (minimal, non-breaking) ---
const FORCE_ALLOW = new Set<string>([
  'https://justicepath-web-qrofchwfea-ue.a.run.app',
  'https://justicepathlaw.com',
  'https://www.justicepathlaw.com',
]);

// Helpers (safe hostname parsing + domain match)
const hostFrom = (u: string) => {
  try { return new URL(u).hostname.toLowerCase(); } catch { return ''; }
};
const FRONTEND_HOST = hostFrom(FRONTEND_ORIGIN);
const hostMatchesDomain = (originHost: string, domain: string) =>
  originHost === domain || originHost.endsWith('.' + domain);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // allow non-browser tools (no Origin header)
    if (!origin) return cb(null, true);

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      if (DEV_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS (dev): ${origin}`));
    }

    // --- prod checks (additive, backwards-compatible) ---
    const oHost = hostFrom(origin);
    const allowByRailway = PROD_REGEX.test(origin);
    const allowByExactCloudRun = FRONTEND_HOST && oHost === FRONTEND_HOST;
    const allowByDomains = FRONTEND_DOMAINS.some(d => hostMatchesDomain(oHost, d));
    const allowByExtraAbsolute = EXTRA_ORIGINS.includes(origin);

    const ok =
      allowByRailway ||
      allowByExactCloudRun ||
      allowByDomains ||
      allowByExtraAbsolute;

    if (ok) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
