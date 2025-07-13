import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const devOrigins = ['http://localhost:5173'];

/**
 * Determines whether the incoming origin is allowed.
 * In production, allows any origin starting with 'https://justicepath-production'.
 * In development, only allows explicitly whitelisted dev origins.
 */
const allowedOrigins = (origin: string | undefined): boolean => {
  if (!origin) return true; // allow non-browser requests (like Postman)
  
  if (process.env.NODE_ENV !== 'production') {
    return devOrigins.includes(origin);
  }

  return origin.startsWith('https://justicepath-production');
};

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    console.log('🌍 Incoming request from origin:', origin);

    if (allowedOrigins(origin)) {
      console.log('✅ CORS allowed');
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
