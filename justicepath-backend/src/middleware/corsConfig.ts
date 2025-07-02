// src/middleware/corsConfig.ts
import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN!,
];

const corsOptions: CorsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
        console.warn('Blocked by CORS:', origin);
      cb(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

export default cors(corsOptions);
