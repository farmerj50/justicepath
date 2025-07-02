import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

dotenv.config(); // ✅ Loads .env if running locally

const app = express();

// ✅ Define allowed origins for CORS
const allowedOrigins = [
  'https://justicepath-production.up.railway.app',
  'http://localhost:5173', // optional: for local development
];

// ✅ CORS config
const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ Middleware: CORS should come first
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight

// ✅ JSON parsing
app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
