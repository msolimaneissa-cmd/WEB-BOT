import { test, expect } from '@playwright/test';

test.describe('API Routes Basic Health and Existence', () => {
  test('Health endpoint returns 200', async ({ request }) => {
    const response = await request.get('/api/bot/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('status');
  });

  test('Rules endpoint exists (no 404)', async ({ request }) => {
    const response = await request.get('/api/bot/rules');
    // It might return 200, 401 (unauthorized) or 429 (rate limit)
    expect(response.status()).not.toBe(404);
  });

  test('Settings endpoint exists (no 404)', async ({ request }) => {
    const response = await request.get('/api/bot/settings');
    expect(response.status()).not.toBe(404);
  });

  test('Streamers endpoint exists (no 404)', async ({ request }) => {
    const response = await request.get('/api/bot/streamers');
    expect(response.status()).not.toBe(404);
  });

  test('Discord webhooks endpoint exists (no 404)', async ({ request }) => {
    const response = await request.post('/api/webhooks/discord');
    expect(response.status()).not.toBe(404);
  });

  test('Alliance requests endpoint exists (no 404)', async ({ request }) => {
    const response = await request.post('/api/alliance-requests');
    expect(response.status()).not.toBe(404);
  });
});
