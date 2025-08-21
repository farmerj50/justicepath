import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import bcrypt from 'bcryptjs';
import { normalize } from 'path';
import jwt from 'jsonwebtoken'; // ✅ for access/refresh handling

const prisma = new PrismaClient();

// ✅ Register a new user
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName, role } = req.body;

  const validRoles = ['USER', 'ADMIN', 'LAWYER', 'BAIL_BONDS', 'PROCESS_SERVER', 'APARTMENT_MANAGER'];
  const normalizedRole = validRoles.includes(role) ? role : 'USER';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { res.status(400).json({ message: 'Email already in use' }); return; }

    const hashed = await hashPassword(password);

    const createdUser = await prisma.user.create({
      data: { email, password: hashed, fullName, role: normalizedRole as Role },
    });

    const user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      select: { id: true, email: true, fullName: true, plan: true, tier: true, role: true },
    });

    if (!user) { res.status(500).json({ message: 'User creation failed' }); return; }

    const token = generateToken(user.id, user.role);
    const decoded = jwt.decode(token) as any;
    console.log('[Register Token Issued]', {
      id: user.id, role: user.role, expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// ✅ Login an existing user
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  console.log('[Login Attempt] Email:', email);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, fullName: true, password: true,
        plan: true, tier: true, role: true,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Short-lived access token (your existing util)
    const token = generateToken(user.id, user.role);
    const decoded = jwt.decode(token) as any;
    console.log('[Login Token Issued]', {
      id: user.id, role: user.role, expiresAt: new Date(decoded.exp * 1000).toISOString(),
    });

    // 🔹 NEW: long-lived refresh token in HttpOnly cookie (no DB change)
    // --- SAFE refresh cookie (login won't fail if env/cookie not ready) ---
const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!refreshSecret) {
  console.warn('[Auth] JWT_REFRESH_SECRET not set — skipping refresh cookie (login still succeeds).');
} else {
  try {
    const refreshToken = jwt.sign(
      { sub: user.id, role: user.role, typ: 'refresh' },
      refreshSecret,
      { expiresIn: '30d' }
    );
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('jp_rt', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,            // set to false only if you’re testing over plain http
      path: '/api/auth',         // must match your route mount
      maxAge: 30 * 24 * 3600 * 1000,
    });
  } catch (e) {
    console.error('[Auth] Failed to set refresh cookie:', e);
    // do not throw; continue with normal login response
  }
}
// --- END SAFE BLOCK ---


    // 👇 Keep your original response payload unchanged
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

// ✅ Refresh access token using HttpOnly cookie (NEW, separate export)
export const refreshSession = async (req: Request, res: Response): Promise<void> => {
  console.log('[refresh] cookie header:', req.headers.cookie, 'parsed:', (req as any).cookies);

  try {
    const rt = (req as any).cookies?.jp_rt; // requires cookie-parser in app bootstrap
    if (!rt) { res.sendStatus(401); return; }

    const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET as string) as any;

    // Issue new short-lived access token using your existing util
    const newAccess = generateToken(payload.sub, payload.role);

    // Optional: rotate refresh on each call
    const newRefresh = jwt.sign(
      { sub: payload.sub, role: payload.role, typ: 'refresh' },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '30d' }
    );
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('jp_rt', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/api/auth',
      maxAge: 30 * 24 * 3600 * 1000,
    });

    // Return the new access token only (client still has user in memory/state)
    res.json({ token: newAccess });
  } catch {
    res.sendStatus(401);
  }
};

// ✅ Get logged-in user's profile
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

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) { return void res.status(404).json({ error: 'User not found' }); }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) { return void res.status(400).json({ error: 'Current password is incorrect' }); }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
    return void res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return void res.status(500).json({ error: 'Internal server error' });
  }
};
