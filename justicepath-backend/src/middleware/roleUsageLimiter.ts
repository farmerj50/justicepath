import type { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

type Limits = { callsPerDay: number; tokensPerDay: number };

// Adjust as you like; uses your existing Role enum values
const ROLE_LIMITS: Record<string, Limits> = {
  FREE:   { callsPerDay: 50,   tokensPerDay: 50_000 },
  PLUS:   { callsPerDay: 200,  tokensPerDay: 300_000 },
  PRO:    { callsPerDay: 1000, tokensPerDay: 2_000_000 },
  LAWYER: { callsPerDay: 400,  tokensPerDay: 600_000 },
  ADMIN:  { callsPerDay: 10_000, tokensPerDay: 50_000_000 },
};

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;
const mem = new Map<string, { calls: number; tokens: number; resetAt: number }>();

const dayKey = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const nextMidnightTs = () => { const d=new Date(); d.setUTCHours(24,0,0,0); return d.getTime(); };

async function load(key: string) {
  if (redis) {
    const [calls, tokens, resetAt] = await redis.hmget(key, 'calls','tokens','resetAt');
    return { calls: Number(calls||0), tokens: Number(tokens||0), resetAt: Number(resetAt||0) };
  }
  return mem.get(key) ?? { calls: 0, tokens: 0, resetAt: 0 };
}
async function save(key: string, v: { calls:number; tokens:number; resetAt:number }) {
  if (redis) {
    await redis.hset(key, { calls:String(v.calls), tokens:String(v.tokens), resetAt:String(v.resetAt) });
    const ttl = Math.max(60, Math.floor((v.resetAt - Date.now())/1000));
    await redis.expire(key, ttl);
    return;
  }
  mem.set(key, v);
}

export async function roleUsageLimiter(req: Request, res: Response, next: NextFunction) {
  // relies on your auth middleware populating req.user.{id,role}
  const role = (req.user?.role || 'FREE').toString();
  const uid = req.user?.id || 'anon';
  const limits = ROLE_LIMITS[role] || ROLE_LIMITS.FREE;

  const key = `usage:${uid}:${dayKey()}`;
  let usage = await load(key);
  if (!usage.resetAt || usage.resetAt < Date.now()) {
    usage = { calls: 0, tokens: 0, resetAt: nextMidnightTs() };
    await save(key, usage);
  }

  if (usage.calls >= limits.callsPerDay) {
    return res.status(429).json({ error: 'usage_exceeded', message: `Daily call limit reached (${limits.callsPerDay}/day).` });
  }

  // expose to the OpenAI wrapper
  res.locals.__usageKey = key;
  res.locals.__limits = limits;
  res.locals.__usage = usage;

  // pre-increment to narrow race window
  usage.calls += 1;
  await save(key, usage);
  return next();
}

export async function addTokens(key: string, n: number) {
  if (!n || n < 0) return;
  const v = await load(key);
  v.tokens += n;
  await save(key, v);
}

export function enforceTokenCap(projected: number, cap: number) {
  if (projected > cap) {
    const err: any = new Error('Daily token limit reached');
    err.status = 429; err.code = 'usage_exceeded';
    throw err;
  }
}
