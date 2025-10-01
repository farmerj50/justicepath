// // routes/ai.ts
// import express, { Request, Response } from 'express';
// import { roleUsageLimiter } from '../middleware/roleUsageLimiter';
// import { chatWithLimits } from '../services/openaiWrapped';

// const router = express.Router();
// router.use(roleUsageLimiter);

// router.post('/follow-up', async (req: Request, res: Response) => {
//   try {
//     const { previousAnswer = '', question, documentType = '', state = '', city = '' } = req.body || {};
//     if (!question || typeof question !== 'string') {
//       return res.status(400).json({ error: 'Question is required.' });
//     }

//     // Stronger but compatible prompt: either structured JSON or plain text
//     const system =
//       'You are a concise legal assistant. Advance the analysis and avoid repeating prior content. ' +
//       'If possible, reply as JSON: {"analysis": string, "strategy": string[], "defenses": string[], "citations": string[], "clarify": string[]} ' +
//       'Otherwise reply in clear plain text.';

//     const user = [
//       previousAnswer ? `Previous answer:\n${previousAnswer}` : '',
//       `Follow-up question:\n${question}`,
//       documentType ? `Document type: ${documentType}` : '',
//       (state || city) ? `User location: ${city ? city + ', ' : ''}${state}` : ''
//     ].filter(Boolean).join('\n\n');

//     const resp = await chatWithLimits(req, {
//       model: 'gpt-4o-mini',
//       temperature: 0.3,
//       messages: [
//         { role: 'system', content: system },
//         { role: 'user', content: user }
//       ]
//     });

//     const raw = resp?.choices?.[0]?.message?.content?.trim() || '';
//     const answer = raw || 'Sorry, I could not generate an answer.';

//     // Try to parse structured JSON; if not, normalize to compatible shape
//     let parsed: any = null;
//     try {
//       if (answer.startsWith('{') || /"analysis"\s*:/.test(answer)) parsed = JSON.parse(answer);
//     } catch {}

//     const analysis = String(parsed?.analysis ?? (parsed ? '' : answer));
//     const strategy = Array.isArray(parsed?.strategy) ? parsed.strategy : [];
//     const defenses = Array.isArray(parsed?.defenses) ? parsed.defenses : [];
//     const citations = Array.isArray(parsed?.citations) ? parsed.citations : [];
//     const clarify = Array.isArray(parsed?.clarify) ? parsed.clarify : [];

//     // ✅ Backwards compatible: keep "answer" AND add structured keys the UI expects
//     return res.json({ answer, analysis, strategy, defenses, citations, clarify });
//   } catch (e: any) {
//     console.error('follow-up error:', e);
//     return res.status(e?.status || 500).json({
//       error: e?.code || 'server_error',
//       message: e?.message || 'Failed to generate follow-up.'
//     });
//   }
// });

// export default router;
