import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const setUserPlan = async (req: Request, res: Response): Promise<void> => {
  const { userId, plan } = req.body;

  if (!userId || !plan) {
    res.status(400).json({ error: 'Missing userId or plan' });
    return;
  }

  const upperPlan = plan.toUpperCase();
  const validPlans = ['FREE', 'PLUS', 'PRO'];

  if (!validPlans.includes(upperPlan)) {
    res.status(400).json({ error: 'Invalid plan type' });
    return;
  }

  try {
    console.log('✅ Updating tier for userId:', userId, 'to:', upperPlan);

    await prisma.user.update({
  where: { id: userId },
  data: {
    tier: upperPlan,
    plan: upperPlan.toLowerCase(), // ✅ Add this line
  },
});


    res.status(200).json({ message: 'Tier updated successfully' });
  } catch (error) {
    console.error('❌ Error updating tier:', error);
    res.status(500).json({ error: 'Error updating tier' });
  }
};
