import express from 'express';
import corsMiddleware from './middleware/corsConfig';
import path from 'path';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';
import documentRoutes from './routes/documentRoutes'; // adjust path as needed
import uploadRoutes from './routes/uploadRoutes';
import stripeRoutes from './routes/stripeRoutes';

const app = express();
console.log('✅ app.ts loaded');

// Apply CORS middleware FIRST
app.use(corsMiddleware);

// Then parse request body
app.use(express.json());

// Mount your routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/payment', stripeRoutes);


export default app;
