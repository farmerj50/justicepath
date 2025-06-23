// backend: justicepath-backend/src/utils/openaiHelper.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runLegalAgent(content: string, documentType?: string) {
  const prompt = `Analyze the following legal document (${documentType ?? 'general'}):\n\n${content}\n\nExplain in plain English what this document is about.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  return {
    main: response.choices[0]?.message?.content || '',
  };
}
