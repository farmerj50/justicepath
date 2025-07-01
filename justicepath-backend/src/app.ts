import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

const app = express();

app.use('/api/auth', authRoutes);

// ✅ Proper CORS setup — only once
app.use(cors({
  origin: [
    'http://localhost:5173', // for local dev
    'https://justicepath-production.up.railway.app' // deployed frontend
  ],
  credentials: true
}));

app.use(express.json());

// ✅ Register routes after middleware

app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
