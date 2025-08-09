// routes/ai.ts
import express from 'express';
import OpenAI from 'openai';

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string });

router.post('/follow-up', async (req, res) => {
  try {
    const { previousAnswer = '', question, documentType = '', state = '', city = '' } = req.body;
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

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const answer = resp.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not generate an answer.';
    return res.json({ answer });
  } catch (e:any) {
    console.error('follow-up error:', e);
    return res.status(500).json({ error: 'Failed to generate follow-up.' });
  }
});

export default router;
