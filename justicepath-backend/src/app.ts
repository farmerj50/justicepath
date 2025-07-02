// src/app.ts
import express from 'express';
import cors from 'cors';
import { corsOptions } from './middleware/corsConfig';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

const app = express();

// ✅ CORS middleware — placed before any routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
