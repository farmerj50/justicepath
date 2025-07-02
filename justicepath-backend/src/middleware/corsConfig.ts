// src/middleware/corsConfig.ts
import cors from 'cors';

const whitelist = [
  'http://localhost:5173', // local dev
  'https://justicepath-production.up.railway.app', // frontend on Railway
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};
