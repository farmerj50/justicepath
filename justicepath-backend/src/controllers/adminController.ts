// controllers/adminController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserSummary = async (req: Request, res: Response) => {
  try {
    const summary = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    const formatted = summary.map((s) => ({
      role: s.role,
      count: s._count.role,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Admin summary error:', err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
};
