import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token); // must return { id: string, role: string }

    req.user = { id: payload.id, role: payload.role }; // ✅ works with global types
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized', error: err });
  }
};


export default authenticate;
