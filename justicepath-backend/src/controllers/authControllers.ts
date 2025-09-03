import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
//type Role = Prisma.Role;
//const testRole: Role = 'USER' as Role; // should type-check


/* ---------- SECURITY CONSTANTS ---------- */
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,128}$/;
const PEPPER = process.env.PASSWORD_PEPPER || '';
const IS_PROD = process.env.NODE_ENV === 'production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

/* Only allow these roles at self-signup (no ADMIN via client) */
const SELF_REGISTER_ROLES: Role[] = [
  'USER',
  'LAWYER',
  'BAIL_BONDS',
  'PROCESS_SERVER',
  'APARTMENT_MANAGER',
];

/* Helpers */
const normalizeEmail = (email: string) => email.trim().toLowerCase();

/* ✅ Register a new user */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName, role } = req.body as {
    email?: string; password?: string; fullName?: string; role?: Role | string;
  };

  try {
    // Basic input checks
    if (!email || !password || !fullName) {
      res.status(400).json({ message: 'Invalid input' }); return;
    }

    const normalizedEmail = normalizeEmail(email);
    const cleanedName = fullName.trim();

    // Enforce password policy (server-side)
    if (!PASSWORD_REGEX.test(password)) {
      res.status(400).json({
        message: 'Password must be 8–128 chars and include uppercase, lowercase, number, and special character.',
      });
      return;
    }

    // Role allowlist (prevents ADMIN via client)
    const normalizedRole: Role = SELF_REGISTER_ROLES.includes(role as Role) ? (role as Role) : 'USER';

    // Existence check (use friendly message or generic to avoid enumeration)
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) { res.status(400).json({ message: 'Email already in use' }); return; }

    // Hash with optional pepper (keeps your hash util)
    const hashed = await hashPassword(password + PEPPER);

    const createdUser = await prisma.user.create({
      data: { email: normalizedEmail, password: hashed, fullName: cleanedName, role: normalizedRole },
    });

    const user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      select: { id: true, email: true, fullName: true, plan: true, tier: true, role: true },
    });

    if (!user) { res.status(500).json({ message: 'User creation failed' }); return; }

    const token = generateToken(user.id, user.role);
    const decoded = jwt.decode(token) as any;
    console.log('[Register Token Issued]', {
      id: user.id, role: user.role, expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'n/a',
    });

    // Also set refresh cookie on register (mirrors login behavior)
    if (REFRESH_SECRET) {
      try {
        const refreshToken = jwt.sign(
          { sub: user.id, role: user.role, typ: 'refresh' },
          REFRESH_SECRET,
          { expiresIn: '30d' }
        );
        res.cookie('jp_rt', refreshToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: IS_PROD,
          path: '/',
          maxAge: 30 * 24 * 3600 * 1000,
        });
      } catch (e) {
        console.error('[Auth] Failed to set refresh cookie (register):', e);
      }
    } else {
      console.warn('[Auth] JWT_REFRESH_SECRET not set — refresh cookie skipped on register.');
    }

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

/* ✅ Login an existing user */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };
  console.log('[Login Attempt] Email:', email);

  try {
    if (!email || !password) { res.status(400).json({ message: 'Invalid input' }); return; }

    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true, email: true, fullName: true, password: true,
        plan: true, tier: true, role: true,
      },
    });

    if (!user || !(await comparePassword(password + PEPPER, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id, user.role);
    const decoded = jwt.decode(token) as any;
    console.log('[Login Token Issued]', {
      id: user.id, role: user.role, expiresAt: decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : 'n/a',
    });

    // Long-lived refresh token in HttpOnly cookie (safe block)
    if (!REFRESH_SECRET) {
      console.warn('[Auth] JWT_REFRESH_SECRET not set — skipping refresh cookie (login still succeeds).');
    } else {
      try {
        const refreshToken = jwt.sign(
          { sub: user.id, role: user.role, typ: 'refresh' },
          REFRESH_SECRET,
          { expiresIn: '30d' }
        );
        res.cookie('jp_rt', refreshToken, {
          httpOnly: true,
          sameSite: 'lax',
          secure: IS_PROD,   // set to false only if you’re testing over plain http
          path: '/', // must match your route mount
          maxAge: 30 * 24 * 3600 * 1000,
        });
      } catch (e) {
        console.error('[Auth] Failed to set refresh cookie:', e);
      }
    }

    // Keep original response shape
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        plan: user.plan,
        tier: user.tier,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

/* ✅ Refresh access token using HttpOnly cookie */
export const refreshSession = async (req: Request, res: Response): Promise<void> => {
  console.log('[refresh] cookie header:', req.headers.cookie, 'parsed:', (req as any).cookies);

  try {
    const rt = (req as any).cookies?.jp_rt; // requires cookie-parser in app bootstrap
    if (!rt || !REFRESH_SECRET) { res.sendStatus(401); return; }

    const payload = jwt.verify(rt, REFRESH_SECRET) as any;

    const newAccess = generateToken(payload.sub, payload.role);

    // Optional: rotate refresh on each call
    const newRefresh = jwt.sign(
      { sub: payload.sub, role: payload.role, typ: 'refresh' },
      REFRESH_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('jp_rt', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: IS_PROD,
      path: '/',
      maxAge: 30 * 24 * 3600 * 1000,
    });

    res.json({ token: newAccess });
  } catch {
    res.sendStatus(401);
  }
};

/* ✅ Get logged-in user's profile */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, email: true, fullName: true, plan: true, tier: true, role: true },
    });

    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

/* ✅ Reset password (policy enforced) */
// export const resetPassword = async (req: Request, res: Response): Promise<void> => {
//   const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
//   const userId = req.user?.id;

//   try {
//     if (!userId || !currentPassword || !newPassword) {
//       res.status(400).json({ error: 'Invalid input' }); return;
//     }

//     if (!PASSWORD_REGEX.test(newPassword)) {
//       res.status(400).json({
//         error: 'New password must be 8–128 chars and include uppercase, lowercase, number, and special character.',
//       });
//       return;
//     }

//     const user = await prisma.user.findUnique({ where: { id: userId } });
//     if (!user) { res.status(404).json({ error: 'User not found' }); return; }

//     const passwordMatch = await bcrypt.compare(currentPassword + PEPPER, user.password);
//     if (!passwordMatch) { res.status(400).json({ error: 'Current password is incorrect' }); return; }

//     const hashedPassword = await bcrypt.hash(newPassword + PEPPER, 10);
//     await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

//     res.status(200).json({ message: 'Password updated successfully' });
//   } catch (error) {
//     console.error('Reset password error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    let { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Normalize
    currentPassword = String(currentPassword).trim();
    newPassword = String(newPassword).trim();

    // ✅ Same rule as Signup
    const PASSWORD_REGEX =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Prevent reusing the same password
    const same = await bcrypt.compare(newPassword, user.password);
    if (same) {
      return res
        .status(400)
        .json({ error: 'New password must be different from old password' });
    }

    // Hash + save
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });

    // (Optional) Invalidate refresh tokens / bump tokenVersion here.

    return res.json({ ok: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};


/* ---- Alias exports to avoid touching routes elsewhere ---- */
export { registerUser as register };
export { loginUser as login };
export { refreshSession as refreshToken };
