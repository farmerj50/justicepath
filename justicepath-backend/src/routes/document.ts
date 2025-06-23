import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/save-ai-doc', async (req, res) => {
  try {
    const { userId, documentType, content, followUps = [], aiSuggestion = '', source = 'form', status = 'draft' } = req.body;

    const doc = await prisma.aiGeneratedDocument.create({
      data: {
        userId,
        documentType,
        content,
        followUps,
        aiSuggestion,
        source,
        status,
      }
    });

    res.status(201).json(doc);
  } catch (error) {
    console.error('❌ Failed to save AI document:', error);
    res.status(500).json({ error: 'Failed to save AI document' });
  }
});

export default router;
