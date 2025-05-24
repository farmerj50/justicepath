import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    req.userId = payload.id;
    next(); // continue the middleware chain
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized', error: err });
  }
};

export default authenticate;
