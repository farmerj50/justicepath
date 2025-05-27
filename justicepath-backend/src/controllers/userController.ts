import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';

export const setUserPlan = async (req: Request, res: Response): Promise<void> => {
  const { userId, plan } = req.body;

  if (!userId || !plan) {
    res.status(400).json({ error: 'Missing userId or plan' });
    return;
  }

  try {
    console.log('Updating plan for userId:', userId, 'to plan:', plan);

    await prisma.user.update({
      where: { id: userId },
      data: { plan },
    });

    res.status(200).json({ message: 'Plan updated' });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Error updating plan' });
  }
};
