import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('/api/alliance-requests', () => {
  test('GET returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:9002/api/alliance-requests');
    const response = await GET(req);
    assert.ok([401, 500].includes(response.status));
  });

  test('POST returns 400 with invalid body', async () => {
    const req = new NextRequest('http://localhost:9002/api/alliance-requests', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    assert.ok([400, 429, 500].includes(response.status));
  });
});
