// routes/ai.ts
import express, { Request, Response } from 'express';
import { roleUsageLimiter } from '../middleware/roleUsageLimiter';
import { chatWithLimits } from '../services/openaiWrapped';

const router = express.Router();

// Make sure your auth middleware (that sets req.user) runs before this router,
// or mount it here above roleUsageLimiter, e.g.:
// router.use(authMiddleware);
router.use(roleUsageLimiter);

router.post('/follow-up', async (req: Request, res: Response) => {
  try {
    const { previousAnswer = '', question, documentType = '', state = '', city = '' } = req.body || {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const system = `You are a concise legal assistant. Answer ONLY the follow-up question.
If jurisdiction matters, mention it briefly. Provide concrete next steps.
Do not repeat the entire prior answer unless necessary.`;

    const user = [
      previousAnswer ? `Previous answer:\n${previousAnswer}` : '',
      `Follow-up question: ${question}`,
      documentType ? `Document type: ${documentType}` : '',
      (state || city) ? `User location: ${city ? city + ', ' : ''}${state}` : '',
    ].filter(Boolean).join('\n\n');

    const resp = await chatWithLimits(req, {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const answer = resp.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate an answer.';
    return res.json({ answer });
  } catch (e: any) {
    console.error('follow-up error:', e);
    return res.status(e?.status || 500).json({
      error: e?.code || 'server_error',
      message: e?.message || 'Failed to generate follow-up.',
    });
  }
});

export default router;
