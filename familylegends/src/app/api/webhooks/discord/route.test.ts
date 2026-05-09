import { test, describe } from 'node:test';
import assert from 'node:assert';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/webhooks/discord', () => {
  test('POST returns 401 without auth header', async () => {
    const req = new NextRequest('http://localhost:9002/api/webhooks/discord', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req as any);
    assert.ok([401, 503].includes(response.status));
  });
});
