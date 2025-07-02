import express from 'express';
import corsMiddleware from './middleware/corsConfig';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

const app = express();

// ⚠️ Critical: Apply CORS before parsing, routing, or error handling

app.options(/.*/, corsMiddleware); // regex catch-all

app.use(express.json());

app.options('/api/auth/login', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://justicepath-production.up.railway.app');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(204).send(); // No content, just acknowledge
});
app.use(corsMiddleware);


// Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
