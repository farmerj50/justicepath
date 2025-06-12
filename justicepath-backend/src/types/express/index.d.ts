// src/types/global.d.ts
import 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string; // ✅ Add this for role-based access
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
