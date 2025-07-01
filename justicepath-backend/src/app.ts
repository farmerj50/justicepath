import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

const app = express();

// ✅ Register CORS before any routes
app.use(cors({
  origin: [
    'http://localhost:5173', // local dev
    'https://justicepath-production.up.railway.app' // production frontend
  ],
  credentials: true,
}));
app.options('*', cors()); // ✅ Preflight support

app.use(express.json());

// ✅ Now register routes AFTER middleware
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
