import express from 'express';
import corsMiddleware from './middleware/corsConfig';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';
import documentRoutes from './routes/documentRoutes';
import stripeRoutes from './routes/stripeRoutes';

const app = express();
console.log('✅ app.ts loaded');
app.set('trust proxy', 1);

const isProd = process.env.NODE_ENV === 'production';

// ensure uploads dir
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ---------- CORS FIRST ----------
app.use(corsMiddleware);              // simple requests
app.options(/.*/, corsMiddleware);    // framework handles preflight

// In PROD only, add a strong catch-all guard so preflight never returns naked 204/404
if (isProd) {
  app.use((req, res, next) => {
    if (req.method !== 'OPTIONS') return next();

    const origin = req.headers.origin as string | undefined;

    const normalize = (s: string) => (s || '').toLowerCase().replace(/\/+$/, '');
    const hostFrom = (u: string) => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } };
    const O = normalize(origin || '');
    const host = hostFrom(O);

    let allowed = false;
    if (!origin) {
      allowed = false;
    } else if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(O)) {
      allowed = true;
    } else {
      try {
        const list = JSON.parse(process.env.CORS_ALLOWLIST_JSON || '[]');
        if (Array.isArray(list) && list.map((x: string) => normalize(x)).includes(O)) allowed = true;
      } catch {}
      if (!allowed && host && (host === 'justicepathlaw.com' || host.endsWith('.justicepathlaw.com'))) {
        allowed = true;
      }
    }

    if (!allowed) return res.sendStatus(403);

    res.setHeader('Access-Control-Allow-Origin', origin!);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

    const reqHdrs = req.header('Access-Control-Request-Headers');
    res.setHeader('Access-Control-Allow-Headers', reqHdrs || 'Content-Type, Authorization');

    res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    return res.sendStatus(204);
  });
}

// (keep Vary for all requests; harmless duplicate on OPTIONS)
app.use((_, res, next) => {
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  next();
});

app.use(cookieParser());
app.use(express.json());

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payment', stripeRoutes);

// static
app.use('/uploads', express.static(uploadDir));

export default app;
