// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Base name of your Railway frontend WITHOUT the suffix
// e.g. justicepath-production -> will allow justicepath-production-xxxx.up.railway.app
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'justicepath-production';
const PROD_REGEX = new RegExp(
  `^https://${FRONTEND_BASE}(-[a-z0-9]+)?\\.up\\.railway\\.app$`
);

// Optional extra prod origins (comma-separated): e.g. FRONTEND_URL=https://app.justicepath.com,https://www.justicepath.com
const EXTRA_ORIGINS =
  (process.env.FRONTEND_URL || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, cb) {
    // allow non-browser (curl/Postman) where Origin is undefined
    if (!origin) return cb(null, true);

    const isDev = process.env.NODE_ENV !== 'production';
    const ok = isDev
      ? DEV_ORIGINS.includes(origin)
      : PROD_REGEX.test(origin) || EXTRA_ORIGINS.includes(origin);

    if (ok) return cb(null, true);
    return cb(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
