import express from 'express';
import { roleUsageLimiter } from '../middleware/roleUsageLimiter';
import { chatWithLimits } from '../services/openaiWrapped';

const router = express.Router();

// Apply middleware after auth
// router.use(authMiddleware);
router.use(roleUsageLimiter);

router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    const response = await chatWithLimits(req, {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: question }],
    });

    const answer = response.choices?.[0]?.message?.content ?? '';
    res.json({ answer });
  } catch (error: any) {
    console.error('OpenAI error:', error);
    res.status(error.status || 500).json({
      error: error.code || 'server_error',
      message: error.message || 'Unexpected error',
    });
  }
});

export default router;
