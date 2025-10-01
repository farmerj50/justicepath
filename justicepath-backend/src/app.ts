// app.ts
import express from 'express';
import corsMiddleware from './middleware/corsConfig'; // default export = safe wrapper
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
import supportRoutes from './routes/support';
import liveAssistRoutes from './routes/liveAssistRoutes';

const app = express();
app.set('trust proxy', 1);

// Ensure uploads dir
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ---- CORS FIRST ----
app.use(corsMiddleware);            // simple requests
app.options(/.*/, corsMiddleware);  // all preflight requests

// Optional preflight log (kept as-is)
app.use((req, _res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('[PREFLIGHT]', {
      url: req.url,
      origin: req.headers.origin,
      acrm: req.headers['access-control-request-method'],
      acrh: req.headers['access-control-request-headers'],
    });
  }
  next();
});

// One Vary header for caches / CDNs
app.use((_, res, next) => {
  res.setHeader('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  next();
});

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payment', stripeRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/live', liveAssistRoutes);

// Static
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store')
;}
}));


export default app;
