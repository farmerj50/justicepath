// src/middleware/checkRole.ts
import { Request, Response, NextFunction } from 'express';

export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log('🔐 checkRole middleware: req.user =', req.user);

    const user = req.user as { role?: string };
    if (!user || !allowedRoles.includes(user.role || '')) {
      console.warn(`🚫 Role "${user?.role}" not in allowed:`, allowedRoles);
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }

    next();
  };
};
