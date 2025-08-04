import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'devsecret';

// Define the token payload structure
interface JWTPayload {
  id: string;
  role: string;
}

// Generate a JWT with id and role
export const generateToken = (id: string, role: string): string =>
  jwt.sign({ id, role }, SECRET, { expiresIn: '15m' });

// Verify a JWT and cast to our JWTPayload shape
export const verifyToken = (token: string): JWTPayload =>
  jwt.verify(token, SECRET) as JWTPayload;

// Extend Express types to include req.user
declare global {
  namespace Express {
    interface User {
      id: string;
      role?: string;
    }

    interface Request {
      user?: User;
    }
  }
}
