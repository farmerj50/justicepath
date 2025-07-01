import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

const app = express();

// ✅ CORS middleware — set this BEFORE any routes
app.use(cors({
  origin: 'https://justicepath-production.up.railway.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.options('*', cors()); // ✅ Handle preflight requests

app.use(express.json());

// ✅ Routes go AFTER cors setup
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
