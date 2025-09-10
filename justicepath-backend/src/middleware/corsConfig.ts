import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const normalize = (s: string) => (s || '').replace(/\/+$/, '').toLowerCase();
const hostFrom = (u: string) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
const hostMatchesDomain = (originHost: string, domain: string) =>
  !!originHost && (originHost === domain || originHost.endsWith('.' + domain));

function parseAllowlist(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter(x => typeof x === 'string').map(normalize);
  } catch {}
  return [];
}

const ABSOLUTE = new Set(parseAllowlist(process.env.CORS_ALLOWLIST_JSON));

// Always accept your base domain + subdomains even if the env var is wrong/missing
const BASE_DOMAINS = ['justicepathlaw.com'];

// Dev convenience (localhost)
function isDevOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // No Origin header (e.g., curl) -> don’t add CORS but don’t throw
    if (!origin) return cb(null, false);

    const O = normalize(origin);
    const host = hostFrom(O);

    // Optional runtime debugging: set DEBUG_CORS=1 on the service to print what the container sees
    if (process.env.DEBUG_CORS === '1') {
      console.log('[CORS]', {
        origin, normalized: O, host,
        absolute: Array.from(ABSOLUTE),
        base: BASE_DOMAINS
      });
    }

    if (isDevOrigin(O)) return cb(null, true);
    if (ABSOLUTE.has(O)) return cb(null, true);
    if (host && BASE_DOMAINS.some(d => hostMatchesDomain(host, d))) return cb(null, true);

    return cb(null, false); // signals “Not allowed by CORS”
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
