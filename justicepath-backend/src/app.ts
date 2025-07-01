import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper';
import adminRoutes from './routes/adminRoutes';
import openaiRoutes from './routes/openaiRoutes';

const app = express();

const allowedOrigin = 'https://justicepath-production.up.railway.app';

// ✅ Fix typing error by using express.RequestHandler
const setCorsHeaders: express.RequestHandler = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

app.use(setCorsHeaders);

// ✅ Backup CORS middleware (only used if browser expects it)
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/openai', openaiRoutes);

export default app;
