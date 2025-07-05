// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const devOrigins = ['http://localhost:5173'];
//const prodOrigins = [process.env.FRONTEND_ORIGIN];
const prodOrigins = ['https://justicepath-production-6c74.up.railway.app'];


const allowedOrigins =
  process.env.NODE_ENV === 'production' ? prodOrigins : devOrigins;

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    console.log('🌍 Incoming request from origin:', origin);
    console.log('✅ Allowed origins:', allowedOrigins);
    console.log('✔ origin === allowedOrigins[0]:', origin === allowedOrigins[0]);

    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      console.warn('❌ Blocked by CORS:', origin);
      cb(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204,
};

export default cors(corsOptions);
