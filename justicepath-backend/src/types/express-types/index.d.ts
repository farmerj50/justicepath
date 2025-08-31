// src/types/global.d.ts
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      id: string;
      role?: Role;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};

