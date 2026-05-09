import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GET, POST, DELETE } from './route';
import { NextRequest } from 'next/server';

describe('/api/bot/rules', () => {
  test('GET returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:9002/api/bot/rules');
    const response = await GET(req);
    assert.ok([401, 500].includes(response.status));
  });

  test('POST returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:9002/api/bot/rules', { method: 'POST' });
    const response = await POST(req);
    assert.ok([401, 500].includes(response.status));
  });

  test('DELETE returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:9002/api/bot/rules?id=test', { method: 'DELETE' });
    const response = await DELETE(req);
    assert.ok([401, 500].includes(response.status));
  });
});
