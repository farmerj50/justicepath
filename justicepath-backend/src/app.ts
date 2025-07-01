import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper'; // ✅ Existing
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes'; // ✅ ADD THIS

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes); // ✅ REGISTER OPENAI ROUTE HERE
app.use(cors({
  origin: ['https://your-frontend-domain.up.railway.app'],
  credentials: true
}));

export default app;
