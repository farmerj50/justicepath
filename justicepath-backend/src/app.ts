import express from 'express';
import corsMiddleware from './middleware/corsConfig';
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

// Create uploads dir at boot (needed on Railway)
const uploadDir = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// CORS first
app.use(corsMiddleware);

// JSON parser (multer handles multipart on the upload route)
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/documents', documentRoutes); // contains POST /upload
app.use('/api/payment', stripeRoutes);

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

export default app;
