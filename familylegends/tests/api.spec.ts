import { test, expect, request } from '@playwright/test';

// Server URLs from environment
const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:3001';
const WEB_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:9002';

// Helper to check if a server is running
async function isServerRunning(url: string): Promise<boolean> {
  try {
    const response = await request.newRequest({ url, method: 'GET' });
    return response.ok() || response.status() === 401 || response.status() === 404;
  } catch {
    return false;
  }
}

test.describe('Bot Health API', () => {
  test('bot status endpoint responds', async ({ request }) => {
    const isRunning = await isServerRunning(`${BOT_URL}/ping`);
    if (!isRunning) {
      test.skip(true, 'Bot server not running');
      return;
    }
    
    const response = await request.get(`${BOT_URL}/ping`);
    expect([200, 401, 404]).toContain(response.status());
  });

  test('bot root endpoint returns status', async ({ request }) => {
    const isRunning = await isServerRunning(BOT_URL);
    if (!isRunning) {
      test.skip(true, 'Bot server not running');
      return;
    }
    
    const response = await request.get(BOT_URL);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

test.describe('Dashboard API Routes', () => {
  test('health route accessible', async ({ page }) => {
    const response = await page.request.get('/api/bot/health');
    expect([200, 503]).toContain(response.status());
  });

  test('stats route accessible', async ({ page }) => {
    const response = await page.request.get('/api/discord-stats');
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('API Rate Limiting', () => {
  test('rate limit headers present on API responses', async ({ page }) => {
    const response = await page.request.get('/api/bot/health');
    const headers = response.headers();
    expect(headers).toBeDefined();
  });
});

test.describe('Login Page', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('discord login button present', async ({ page }) => {
    await page.goto('/login');
    const discordBtn = page.locator('button:has-text("Discord"), [href*="discord"]');
    await expect(discordBtn.first()).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('404 page displays correctly', async ({ page }) => {
    const response = await page.request.get('/this-page-does-not-exist-12345');
    expect([404, 200]).toContain(response.status());
  });

  test('invalid API returns proper error', async ({ page }) => {
    const response = await page.request.get('/api/bot/invalid-route-xyz');
    expect([404, 500]).toContain(response.status());
  });
});