import { Request, Response, Router } from 'express';
import { saveAiGeneratedDocument } from '../utils/aiDocumentHelper';
import { PrismaClient } from '@prisma/client';
import { runLegalAgent } from '../utils/openaiHelper';
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string });


const prisma = new PrismaClient();
const router = Router();
// DELETE /api/ai-documents/:id
router.delete('/ai-documents/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.aiGeneratedDocument.delete({
      where: { id }
    });
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
router.post('/save-ai-document', async (req: Request<any, any, SaveAiDocRequest>, res: Response): Promise<void> => {
  const { userId, documentType, content, followUps, aiSuggestion, source, status } = req.body;

  if (!userId || !documentType || !content) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    // 1. Save to AiGeneratedDocument
    const savedAI = await saveAiGeneratedDocument({
      userId,
      documentType,
      content,
      followUps,
      aiSuggestion,
      source,
      status,
    });

    // 2. Also save to Document table
    const title = `${documentType} Draft`;
    await prisma.document.create({
      data: {
        userId,
        title,
        type: documentType,
        content,
        fileUrl: '', // You can leave this empty or generate it if PDF is created
        status: 'draft',
        source: 'ai',
      },
    });

    res.status(200).json(savedAI);
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

// POST /api/ai/follow-up

router.post('/follow-up', async (req, res) => {
  try {
    const {
      previousAnswer = '',
      question,
      documentType = '',
      state = '',
      city = '',
    } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const system =
`You are a zealous, detail-oriented **landlord–tenant attorney**.
Write precise, actionable guidance with short paragraphs and bullet points.
Tailor analysis to the user's jurisdiction when given.
**Do not repeat** content already covered unless you must to build a legal argument.
Prefer statutes and deadlines; include simple citations (statute names/sections, no links).`;

    // Force expansion: require NEW points vs previousAnswer
    const userMsg =
`Jurisdiction: ${city ? city + ', ' : ''}${state || 'Unknown'}
Matter type: ${documentType || 'General'}
Previous answer (for context; avoid repeating):\n${previousAnswer || '(none)'}
Follow-up question (expand depth; add NEW analysis not already said): ${question}

Return JSON with keys:
- "analysis": expanded legal analysis using IRAC where relevant (Issue, Rule with cites, Application, Conclusion).
- "strategy": concrete next steps, motions/filings, deadlines, and evidence to gather.
- "defenses": likely defenses/counterarguments relevant to the facts and jurisdiction.
- "citations": short list of statutes/rules (e.g., "Fla. Stat. § 83.56(2)").
- "clarify": 3–5 targeted questions to close factual gaps.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,              // tighter, more legalistic
      top_p: 0.9,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      response_format: { type: 'json_object' }, // force structured output
    });

    const payload = resp.choices?.[0]?.message?.content?.trim();
    if (!payload) return res.status(500).json({ error: 'Empty answer' });

    // Already JSON because of response_format
    return res.json(JSON.parse(payload));
  } catch (e) {
    console.error('follow-up error:', e);
    return res.status(500).json({ error: 'Failed to generate follow-up.' });
  }
});

export default router;
