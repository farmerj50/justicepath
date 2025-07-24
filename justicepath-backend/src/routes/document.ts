import express, { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

interface SaveAIDocRequestBody {
  userId: string;
  documentType: string;
  content: string;
  followUps?: Array<{ question: string; answer: string }>;
  aiSuggestion?: string;
  source?: string;
  status?: string;
  title?: string;
  name?: string;
  court?: string;
  motionType?: string;
  caseNumber?: string;
  claimants?: string;
  respondents?: string;
  fileUrl?: string;
  type?: string;
}

router.post(
  '/save-ai-doc',
  async (
    req: Request<{}, {}, SaveAIDocRequestBody>,
    res: Response
  ): Promise<void> => {
    try {
      const {
        userId,
        documentType,
        content,
        followUps = [],
        aiSuggestion = '',
        source = 'form',
        status = 'draft',
        title = 'Untitled',
        name = '',
        court = '',
        motionType = '',
        caseNumber = '',
        claimants = '',
        respondents = '',
        fileUrl = '',
        type = documentType || 'document'
      } = req.body;

      if (!userId || !content) {
        res.status(400).json({ error: 'Missing userId or content' });
        return;
      }

      const savedDoc = await prisma.document.create({
        data: {
          userId,
          title: title || 'Untitled',
          type: type || 'document',
          fileUrl: fileUrl || '',
          content,
          name,
          court,
          motionType,
          caseNumber,
          claimants,
          respondents
        }
      });

      const aiDoc = await prisma.aiGeneratedDocument.create({
        data: {
          userId,
          documentId: savedDoc.id,
          followUps,
          aiSuggestion,
          source,
          status
        }
      });

      res.status(201).json({ document: savedDoc, aiMetadata: aiDoc });
    } catch (error) {
      console.error('❌ Failed to save AI document:', error);
      res.status(500).json({ error: 'Failed to save AI document' });
    }
  }
);

export default router;
