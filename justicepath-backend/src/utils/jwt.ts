import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devsecret';

export const generateToken = (id: string) => jwt.sign({ id }, SECRET, { expiresIn: '7d' });
export const verifyToken = (token: string) => jwt.verify(token, SECRET) as { id: string };

// Types augmentation for req.userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
