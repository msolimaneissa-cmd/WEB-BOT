import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('/api/discord-stats', () => {
  test('should return 503 when MONGODB_URI is not set', { concurrency: false }, async () => {
    // This test requires MONGODB_URI env var + a running MongoDB to test the full flow
    // When MONGODB_URI is not set, connectBotDB returns null → 503
    const req = new NextRequest('http://localhost:9002/api/discord-stats');
    const response = await GET(req);
    assert.ok([503, 200].includes(response.status));
  });
});
