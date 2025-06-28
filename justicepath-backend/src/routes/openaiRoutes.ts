import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/ask', async (req, res) => {
  const { question } = req.body;

  try {
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: question }],
      model: 'gpt-4', // or 'gpt-3.5-turbo'
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (error: any) {
    console.error('OpenAI backend error:', error);
    res.status(500).json({ error: 'Failed to get response from OpenAI' });
  }
});

export default router;
