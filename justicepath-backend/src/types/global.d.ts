// src/types/global.d.ts
import 'express'; 
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
