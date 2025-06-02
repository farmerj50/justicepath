import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes'; // ✅ ADD this line
import documentRoutes from './routes/documentRoutes';



const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/documents', documentRoutes);

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes); // ✅ ADD this line to expose /api/set-plan

export default app;

