// src/utils/tokens.ts
import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET as Secret;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as Secret;

// Narrow the types so TS knows these are valid 'expiresIn' values
const ACCESS_TTL  = (process.env.JWT_ACCESS_TTL  ?? '15m') as SignOptions['expiresIn'];
const REFRESH_TTL = (process.env.JWT_REFRESH_TTL ?? '30d') as SignOptions['expiresIn'];

export function signAccessToken(payload: object) {
  // runtime guard is optional but helpful
  if (!ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET is not set');
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload: object) {
  if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not set');
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

export function verifyRefreshToken(token: string) {
  if (!REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not set');
  return jwt.verify(token, REFRESH_SECRET);
}
