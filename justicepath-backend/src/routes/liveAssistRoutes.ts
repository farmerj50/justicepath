import express, { Request, Response } from 'express';
import { roleUsageLimiter } from '../middleware/roleUsageLimiter';
import { chatWithLimits } from '../services/openaiWrapped';

const router = express.Router();
router.use(roleUsageLimiter);

router.post('/advise', async (req: Request, res: Response) => {
  try {
    const {
      utterance,
      jurisdiction = '',
      caseType = '',
      forceAction = false,
    } = req.body || {};

    if (!utterance || typeof utterance !== 'string') {
      return res.status(400).json({ error: 'utterance_required' });
    }

    const draftSystem =
      'You are a legal drafting assistant. OUTPUT ONLY the full document between <<BEGIN DOC>> and <<END DOC>>. If details are missing, use bracket placeholders like [COUNTY], [CASE NO.]. Include caption, title, facts/intro, law/argument, requested relief, signature block, certificate of service, and a [PROPOSED ORDER] if appropriate.';
    const analysisSystem =
      'You are a zealous, detail-oriented attorney. Give direct, actionable guidance. If info is missing, make reasonable assumptions and add one line "Assumptions: ...". Prefer statutes and deadlines. Return a VALID JSON object with keys: analysis, strategy, defenses, citations, clarify.';

    const wantsAction =
      forceAction ||
      /\b(draft|write|motion|petition|complaint|affidavit|prepare|create)\b/i.test(utterance);

    const system = wantsAction ? draftSystem : analysisSystem;

    const userMsg = [
      jurisdiction ? `Jurisdiction: ${jurisdiction}` : '',
      caseType ? `Case type: ${caseType}` : '',
      `Live utterance:\n${utterance}`,
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
    if (!raw) return res.status(500).json({ error: 'empty_response' });

    if (wantsAction) {
      const m = raw.match(/<<BEGIN DOC>>([\s\S]*?)<<END DOC>>/i);
      const doc = (m?.[1] || raw).trim();
      return res.json({ doc, answer: doc });
    }

    try {
      const json = JSON.parse(raw);
      return res.json({
        analysis: String(json.analysis ?? ''),
        strategy: Array.isArray(json.strategy) ? json.strategy : [],
        defenses: Array.isArray(json.defenses) ? json.defenses : [],
        citations: Array.isArray(json.citations) ? json.citations : [],
        clarify: Array.isArray(json.clarify) ? json.clarify : [],
      });
    } catch {
      return res.json({ analysis: raw, strategy: [], defenses: [], citations: [], clarify: [] });
    }
  } catch (e: any) {
    console.error('live/advise error:', e);
    return res.status(e?.status || 500).json({
      error: e?.code || 'server_error',
      message: e?.message || 'Failed',
    });
  }
});

export default router;
