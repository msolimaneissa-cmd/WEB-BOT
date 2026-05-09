import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetInMs: number }> {
  if (redis) {
    const key = `ratelimit:${identifier}`;
    const current = await redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count === 0) {
      await redis.setex(key, Math.ceil(config.windowMs / 1000), 1);
      return { allowed: true, remaining: config.maxRequests - 1, resetInMs: config.windowMs };
    }

    if (count >= config.maxRequests) {
      const ttl = await redis.ttl(key);
      return { allowed: false, remaining: 0, resetInMs: ttl > 0 ? ttl * 1000 : config.windowMs };
    }

    await redis.incr(key);
    const ttl = await redis.ttl(key);
    return { allowed: true, remaining: config.maxRequests - count - 1, resetInMs: ttl > 0 ? ttl * 1000 : config.windowMs };
  }

  // Fallback: in-memory rate limiting
  const now = Date.now();
  const record = inMemoryStore.get(identifier);
  if (!record || now > record.resetAt) {
    inMemoryStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetInMs: config.windowMs };
  }

  if (record.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetInMs: record.resetAt - now };
  }

  record.count++;
  return { allowed: true, remaining: config.maxRequests - record.count, resetInMs: record.resetAt - now };
}

export function rateLimitResponse(resetInMs: number) {
  return NextResponse.json(
    { error: 'طلبات كثيرة جداً. الرجاء الانتظار قبل المحاولة مرة أخرى.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetInMs / 1000)),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000 + resetInMs / 1000)),
      },
    }
  );
}
