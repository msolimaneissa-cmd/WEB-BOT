import { describe, it } from 'node:test';
import assert from 'node:assert';
import { checkRateLimit, rateLimitResponse } from './rate-limit';

describe('checkRateLimit', () => {
  it('allows first request within window', async () => {
    const result = await checkRateLimit('test:unit-1', { maxRequests: 5, windowMs: 60000 });
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.remaining, 4);
  });

  it('blocks when exceeding max requests', async () => {
    const id = `test:block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(id, { maxRequests: 3, windowMs: 60000 });
    }
    const result = await checkRateLimit(id, { maxRequests: 3, windowMs: 60000 });
    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.remaining, 0);
  });

  it('returns correct remaining count', async () => {
    const id = `test:remaining-${Date.now()}`;
    const r1 = await checkRateLimit(id, { maxRequests: 5, windowMs: 60000 });
    assert.strictEqual(r1.remaining, 4);
    const r2 = await checkRateLimit(id, { maxRequests: 5, windowMs: 60000 });
    assert.strictEqual(r2.remaining, 3);
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 with retry headers', () => {
    const res = rateLimitResponse(30000);
    assert.strictEqual(res.status, 429);
    assert.ok(res.headers.get('Retry-After'));
    assert.ok(res.headers.get('X-RateLimit-Reset'));
  });
});
