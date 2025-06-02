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

    // ✅ Add the user to the request object
    //(req as any).user = { id: payload.id };
    (req as any).user = { id: payload.id };


    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized', error: err });
  }
};

export default authenticate;
