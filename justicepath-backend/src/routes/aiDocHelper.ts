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

// POST /api/ai/follow-up  (action-first)
router.post('/follow-up', async (req: Request, res: Response) => {
  try {
    const {
      previousAnswer = '',
      question,
      documentType = '',
      state = '',
      city = '',
      caseType = '',
      jurisdiction = '',
      forceAction = false
    } = req.body ?? {};

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

  // detect action
  const actionVerbRe = /\b(draft|write|prepare|generate|create|compose|produce|file|format|redraft|revise|provide|give|supply|furnish|make)\b/i;
  const docNounRe = /\b(motion|pleading|petition|complaint|answer|affidavit|declaration|brief|memorandum|memo|notice|demand letter|letter|subpoena|interrogatories|requests? for (production|admission)|discovery|proposed order|order|continuance|extension|fee waiver|eviction answer|response|opposition|reply)\b/i;
  const wantsAction = !!forceAction || /\bmotion to\b/i.test(question) || actionVerbRe.test(question) || docNounRe.test(question);

  const jurisdictionHint = jurisdiction || (state ? `${city ? city + ', ' : ''}${state}` : '');

  const draftSystem = [
    'You are a legal drafting assistant.',
    'OUTPUT POLICY:',
    '- Output ONLY the full document between <<BEGIN DOC>> and <<END DOC>>.',
    '- Do NOT ask clarifying questions.',
    '- If details are unknown, insert bracket placeholders like [COUNTY], [DEFENDANT NAME], [CASE NO.].',
    '- Include: caption, title, facts/intro, law/argument, requested relief, signature block, certificate of service, and a [PROPOSED ORDER] if appropriate.',
    `- JURISDICTION LOCK: Use only this jurisdiction: ${jurisdictionHint || 'Unknown'}. Ignore any other jurisdiction mentioned in prior text.`,
  ].join(' ');

  const analysisSystem = [
    'You are a zealous, detail-oriented landlord–tenant attorney.',
    'Always answer directly without asking the user questions back.',
    'If information is missing, make reasonable assumptions and add a single line starting with "Assumptions:".',
    `JURISDICTION LOCK: Use only this jurisdiction: ${jurisdictionHint || 'Unknown'}. Ignore any other jurisdiction mentioned in prior text.`,
    'Prefer statutes and deadlines; include simple citations (names/sections, no links).',
    'Return a VALID JSON object with keys: analysis, strategy, defenses, citations, clarify.',
  ].join(' ');

  const system = wantsAction ? draftSystem : analysisSystem;

  const userMsg = [
    jurisdictionHint ? `Jurisdiction: ${jurisdictionHint}` : '',
    (state || city) ? `User location: ${city ? city + ', ' : ''}${state}` : '',
    documentType ? `Document type: ${documentType}` : '',
    caseType ? `Case type: ${caseType}` : '',
    // ⬇️ only include prior answer for analysis, NOT for drafting
    (!wantsAction && previousAnswer) ? `Previous answer (context; avoid repeating):\n${previousAnswer}` : '',
    `Follow-up request:\n${question}`,
  ].filter(Boolean).join('\n\n');

    const resp = await chatWithLimits(req, {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
    });

    const raw = resp.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(500).json({ error: 'Empty answer' });

    if (wantsAction) {
      // 📄 Extract the drafted document
      const m = raw.match(/<<BEGIN DOC>>([\s\S]*?)<<END DOC>>/i);
      const doc = (m?.[1] || raw).trim();
      // Legacy compatibility: return "answer" AND "doc"
      return res.json({ answer: doc, doc });
    }

    // 🧩 Non-action path: keep JSON shape (never ask questions—include "Assumptions:" instead)
    try {
      const json = JSON.parse(raw);
      return res.json({
        analysis: String(json.analysis ?? ''),
        strategy: Array.isArray(json.strategy) ? json.strategy : [],
        defenses: Array.isArray(json.defenses) ? json.defenses : [],
        citations: Array.isArray(json.citations) ? json.citations : [],
        clarify: Array.isArray(json.clarify) ? json.clarify : []
      });
    } catch {
      return res.json({ analysis: raw, strategy: [], defenses: [], citations: [], clarify: [] });
    }
  } catch (e: any) {
    console.error('follow-up error:', e);
    return res.status(e?.status || 500).json({
      error: e?.code || 'server_error',
      message: e?.message || 'Failed to generate follow-up.',
    });
  }
});


export default router;