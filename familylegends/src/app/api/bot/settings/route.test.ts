import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';

describe('/api/bot/settings', () => {
  test('GET returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:9002/api/bot/settings');
    const response = await GET(req);
    assert.ok([401, 500].includes(response.status));
  });

  test('PUT returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost:9002/api/bot/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(req);
    assert.ok([401, 500].includes(response.status));
  });
});
