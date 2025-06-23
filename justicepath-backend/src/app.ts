import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import aiDocRoutes from './routes/aiDocHelper'; // ✅ ADD THIS
import adminRoutes from './routes/adminRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/ai', aiDocRoutes); // ✅ REGISTER THE AI DOC ROUTE HERE
app.use('/api/admin', adminRoutes);


export default app;
