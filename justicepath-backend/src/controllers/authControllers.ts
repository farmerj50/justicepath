import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { normalize } from 'path';

const prisma = new PrismaClient();

// ✅ Register a new user
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName, role } = req.body;

  const validRoles = ['USER', 'ADMIN', 'LAWYER', 'BAIL_BONDS', 'PROCESS_SERVER', 'APARTMENT_MANAGER'];
  const normalizedRole = validRoles.includes(role) ? role : 'USER';

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Email already in use' });
      return;
    }

    const hashed = await hashPassword(password);

    const createdUser = await prisma.user.create({
      data: {
        email,
        password: hashed,
        fullName,
        role: normalizedRole as Role,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: createdUser.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        plan: true,
        tier: true,
        role: true,
      },
    });

    if (!user) {
      res.status(500).json({ message: 'User creation failed' });
      return;
    }

    const token = generateToken(user.id, user.role);
    res.status(201).json({ user, token });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};

// ✅ Login an existing user
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        password: true,
        plan: true,
        tier: true,
        role: true,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id, user.role);
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

// ✅ Get logged-in user's profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        plan: true,
        tier: true,
        role: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
};
