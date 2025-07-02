// 📁 src/middleware/corsConfig.ts
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN || 'https://justicepath-production.up.railway.app'
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
};

export default cors(corsOptions);
