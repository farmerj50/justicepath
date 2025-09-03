import jwt, { Secret } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || process.env.JWT_SECRET || 'devsecret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_SECRET;

export default function authenticate(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  const headerToken =
    h && h.toLowerCase().startsWith('bearer ') ? h.split(' ')[1] : null;

  // cookie-parser adds req.cookies; also fall back to raw header
  const cookieHeader = req.headers.cookie || '';
  const cookieToken =
    (req as any).cookies?.jp_rt ??
    (cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('jp_rt='))?.split('=').slice(1).join('='));

  // 🔎 DEV ONLY: show what we got
  if (process.env.NODE_ENV !== 'production') {
    console.log('[auth] ▶', {
      url: req.originalUrl,
      method: req.method,
      hasHeaderToken: !!headerToken,
      hasCookieHeader: /(^|;\s*)jp_rt=/.test(cookieHeader),
      parsedCookiePresent: !!(req as any).cookies?.jp_rt,
      origin: req.headers.origin,
    });
  }

  // prefer cookie; fall back to header
let payload: any;
try {
  if (cookieToken) {
    // Cookie should be verified with REFRESH secret
    payload = jwt.verify(cookieToken, REFRESH_SECRET as Secret);
  } else if (headerToken) {                // <-- was cookieToken by mistake
    payload = jwt.verify(headerToken, ACCESS_SECRET as Secret);
  } else {
    if (process.env.NODE_ENV !== 'production') console.log('[auth] ❌ No token in header or cookie');
    res.status(401).json({ message: 'Unauthorized: no token' });
    return;
  }
} catch (e) {
  if (process.env.NODE_ENV !== 'production') console.log('[auth] ❌ Token verify failed:', (e as Error).message);
  res.status(401).json({ message: 'Unauthorized: invalid token' });
  return;
}
(req as any).user = { id: (payload as any).sub || (payload as any).id, role: payload.role };

next();

}
