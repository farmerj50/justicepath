// app.ts

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
app.set('trust proxy', 1);

// Ensure uploads dir
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ---- CORS (single responder) ----
app.use(corsMiddleware);           // simple requests
app.options(/.*/, corsMiddleware);  // all preflight requests

// Optional: add a single Vary header (safe)
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

// Static
app.use('/uploads', express.static(uploadDir));

export default app;
