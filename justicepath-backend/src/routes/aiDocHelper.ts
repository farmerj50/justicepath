import { Request, Response, Router } from 'express';
import { saveAiGeneratedDocument } from '../utils/aiDocumentHelper';
import { PrismaClient } from '@prisma/client';
import { runLegalAgent } from '../utils/openaiHelper';


const prisma = new PrismaClient();
const router = Router();

interface SaveAiDocRequest {
  userId: string;
  documentType: string;
  content: string;
  followUps?: Array<{ question: string; answer: string }>;
  aiSuggestion?: string;
  source?: string;
  status?: string;
}
interface AnalyzeDocRequest {
  content: string;
  documentType?: string;
}


// POST /api/save-ai-document
router.post('/save-ai-document', async (req: Request<any, any, SaveAiDocRequest>, res: Response): Promise<void> => {
  const { userId, documentType, content, followUps, aiSuggestion, source, status } = req.body;

  if (!userId || !documentType || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const saved = await saveAiGeneratedDocument({
      userId,
      documentType,
      content,
      followUps,
      aiSuggestion,
      source,
      status,
    });
    res.status(200).json(saved);
  } catch (error) {
    console.error('❌ Failed to save AI doc:', error);
    res.status(500).json({ error: 'Server error saving document' });
  }
});

// GET /api/ai-documents/:userId
router.get('/ai-documents/:userId', async (req: Request<{ userId: string }, any, any, any>, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'Missing userId in params' });
    return;
  }

  try {
    const documents = await prisma.aiGeneratedDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.status(200).json(documents);
  } catch (error) {
    console.error('❌ Failed to fetch AI documents:', error);
    res.status(500).json({ error: 'Server error fetching documents' });
  }
});
// src/routes/aiDocHelper.ts
router.post('/analyze-document', async (req: Request, res: Response): Promise<void> => {
  const { content, documentType } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Missing content' });
    return;
  }

  try {
    const result = await runLegalAgent(content, documentType);

    // ✅ Ensure the result is a string
    const safeResult = typeof result === 'string' ? result : JSON.stringify(result);

    res.status(200).json({ main: safeResult });
  } catch (err: any) {
    console.error('❌ AI analysis failed:', err);
    

    res.status(500).json({
      error: 'AI analysis error',
      message: err?.message || 'Unknown error'
    });
  }
});





export default router;
