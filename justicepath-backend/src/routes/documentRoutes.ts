import express from 'express';
import { prisma } from '../../prisma/client';
import authenticate from '../middleware/authMiddleware';
import { Request, Response } from 'express';

const router = express.Router();

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc || doc.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json(doc);
    return; // ✅ explicitly return nothing
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});
router.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  // ✅ Include fileUrl here
  const {
    title,
    type,
    fileUrl, // ✅ Required field from Prisma schema
    content,
    name,
    court,
    motionType,
    caseNumber,
    claimants,
    respondents
  } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (!fileUrl || !title || !type) {
    res.status(400).json({ message: 'Missing required fields' });
    return;
  }

  try {
    const newDoc = await prisma.document.create({
      data: {
        userId,
        title,
        type,
        fileUrl, // ✅ Must be included
        content,
        name,
        court,
        motionType,
        caseNumber,
        claimants,
        respondents
      }
    });

    res.status(201).json(newDoc);
    return;
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});


router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const doc = await prisma.document.findUnique({ where: { id } });

    if (!doc || doc.userId !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: req.body,
    });

    res.status(200).json(updated);
    return;
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ message: 'Server error' });
    return;
  }
});

export default router;