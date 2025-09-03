// src/routes/aiDocHelper.ts
import { Request, Response, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { saveAiGeneratedDocument } from '../utils/aiDocumentHelper';
import { runLegalAgent } from '../utils/openaiHelper';

// ✅ New imports for rate limits + wrapped OpenAI calls
import { roleUsageLimiter } from '../middleware/roleUsageLimiter';
import { chatWithLimits } from '../services/openaiWrapped';

const prisma = new PrismaClient();
const router = Router();

// Make sure your auth middleware (that sets req.user) runs before this router,
// or mount it here above roleUsageLimiter, e.g.:
// router.use(authMiddleware);
router.use(roleUsageLimiter);

// DELETE /api/ai-documents/:id
router.delete('/ai-documents/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.aiGeneratedDocument.delete({ where: { id } });
    res.status(200).json({ message: 'Document deleted' });
  } catch (error) {
    console.error('❌ Failed to delete document:', error);
    res.status(500).json({ error: 'Error deleting document' });
  }
});

interface SaveAiDocRequest {
  userId: string;
  documentType: string;
  content: string;
  followUps?: Array<{ question: string; answer: string }>;
  aiSuggestion?: string;
  source?: string;
  status?: string;
  title?: string;
  type?: string;
  fileUrl?: string;
  name?: string;
  court?: string;
  motionType?: string;
  caseNumber?: string;
  claimants?: string;
  respondents?: string;
}

interface AnalyzeDocRequest {
  content: string;
  documentType?: string;
}

// POST /api/save-ai-document
router.post(
  '/save-ai-document',
  async (req: Request<any, any, SaveAiDocRequest>, res: Response): Promise<void> => {
    const { userId, documentType, content, followUps, aiSuggestion, source, status } = req.body;

    if (!userId || !documentType || !content) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      // 1) Save to AiGeneratedDocument
      const savedAI = await saveAiGeneratedDocument({
        userId,
        documentType,
        content,
        followUps,
        aiSuggestion,
        source,
        status,
      });

      // 2) Also save to Document table
      const title = `${documentType} Draft`;
      await prisma.document.create({
        data: {
          userId,
          title,
          type: documentType,
          content,
          fileUrl: '', // optional: fill if/when you generate a file
          status: 'draft',
          source: 'ai',
        },
      });

      res.status(200).json(savedAI);
    } catch (error) {
      console.error('❌ Failed to save AI doc:', error);
      res.status(500).json({ error: 'Server error saving document' });
    }
  }
);

// GET /api/ai-documents/:userId
router.get(
  '/ai-documents/:userId',
  async (req: Request<{ userId: string }>, res: Response): Promise<void> => {
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
  }
);

// POST /api/analyze-document
router.post('/analyze-document', async (req: Request<any, any, AnalyzeDocRequest>, res: Response): Promise<void> => {
  const { content, documentType } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Missing content' });
    return;
  }

  try {
    // ⚠️ As requested, we leave openaiHelper as-is.
    const result = await runLegalAgent(content, documentType);

    const safeResult = typeof result === 'string' ? result : JSON.stringify(result);
    res.status(200).json({ main: safeResult });
  } catch (err: any) {
    console.error('❌ AI analysis failed:', err);
    res.status(500).json({
      error: 'AI analysis error',
      message: err?.message || 'Unknown error',
    });
  }
});

// POST /api/follow-up
router.post('/follow-up', async (req: Request, res: Response) => {
  try {
    const {
      previousAnswer = '',
      question,
      documentType = '',
      state = '',
      city = '',
    } = req.body ?? {};

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const system = `You are a zealous, detail-oriented landlord–tenant attorney.
Write precise, actionable guidance with short paragraphs and bullet points.
Tailor analysis to the user's jurisdiction when given.
Do not repeat content already covered unless necessary to build a legal argument.
Prefer statutes and deadlines; include simple citations (statute names/sections, no links).
Return a VALID JSON object with keys: analysis, strategy, defenses, citations, clarify.`;

    // We’ll *ask* for JSON and parse it, rather than using response_format,
    // so we don't have to change the wrapper's type signature.
    const userMsg =
`Jurisdiction: ${city ? city + ', ' : ''}${state || 'Unknown'}
Matter type: ${documentType || 'General'}
Previous answer (context; avoid repeating): 
${previousAnswer || '(none)'}
Follow-up question (expand depth; add NEW analysis not already said): ${question}

Respond ONLY with a compact JSON object:
{
  "analysis": "...",
  "strategy": ["...", "..."],
  "defenses": ["...", "..."],
  "citations": ["Stat. § ...", "..."],
  "clarify": ["Q1", "Q2", "Q3"]
}`;

    const resp = await chatWithLimits(req, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      // If you later extend chatWithLimits to pass through extra params,
      // you could add: top_p, response_format, etc.
    });

    const raw = resp.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: 'Empty answer' });

    let json: any;
    try {
      json = JSON.parse(raw);
    } catch {
      // Fallback: wrap non-JSON content to avoid failing the request.
      json = { analysis: raw };
    }

    return res.json(json);
  } catch (e: any) {
    console.error('follow-up error:', e);
    return res.status(e?.status || 500).json({
      error: e?.code || 'server_error',
      message: e?.message || 'Failed to generate follow-up.',
    });
  }
});

export default router;
