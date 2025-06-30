// controllers/adminController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Route: GET /api/admin/user-summary
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

// ✅ Route: GET /api/admin/dashboard-stats
// ✅ Route: GET /api/admin/dashboard-stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();

    // Documents with 'type' defined = new cases
    const newCases = await prisma.document.count({
      where: {
        type: {
          not: undefined,
        },
      },
    });

    // Documents with 'motionType' defined = open cases
    const openCases = await prisma.document.count({
      where: {
        motionType: {
          not: null,
        },
      },
    });

    // Documents with 'claimants' defined = closed cases
    const closedCases = await prisma.document.count({
      where: {
        claimants: {
          not: null,
        },
      },
    });

    // Recent users
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        fullName: true,
        role: true,
        createdAt: true,
      },
    });

    // ✅ LOG the values returned
    console.log('[ADMIN DASHBOARD STATS]', {
      totalUsers,
      newCases,
      openCases,
      closedCases,
      recentUsers,
    });

    res.json({
      totalUsers,
      newCases,
      openCases,
      closedCases,
      recentUsers,
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

