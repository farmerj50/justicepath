import { OpenAI } from 'openai';
import type { Request } from 'express';
import { addTokens, enforceTokenCap } from '../middleware/roleUsageLimiter';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type ChatArgs = {
  model: string;
  messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>;
  temperature?: number;
  max_tokens?: number;
};

export async function chatWithLimits(req: Request, args: ChatArgs) {
  const resp = await openai.chat.completions.create({
    model: args.model,
    messages: args.messages,
    temperature: args.temperature ?? 0.2,
    max_tokens: args.max_tokens ?? 512,
  });

  const used = resp.usage?.total_tokens ?? 0;
  const key = (req.res?.locals.__usageKey as string) || '';
  const limits = (req.res?.locals.__limits as { tokensPerDay: number }) || { tokensPerDay: Number.MAX_SAFE_INTEGER };
  const usage = (req.res?.locals.__usage as { tokens: number }) || { tokens: 0 };

  enforceTokenCap(usage.tokens + used, limits.tokensPerDay);
  if (key) await addTokens(key, used);

  return resp;
}
