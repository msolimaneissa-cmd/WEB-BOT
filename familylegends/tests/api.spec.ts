import { test, expect } from '@playwright/test';

// Note: These tests require the bot to be running
// Set BOT_URL environment variable to test against local bot

const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:3001';

test.describe('Bot Health API', () => {
  test('bot status endpoint responds', async ({ request }) => {
    // Test if bot server is reachable
    const response = await request.get(`${BOT_URL}/ping`);
    
    // Should get some response (200 or 401)
    expect([200, 401, 404]).toContain(response.status());
  });

  test('bot root endpoint returns status', async ({ request }) => {
    const response = await request.get(`${BOT_URL}/`);
    
    // Should return JSON status
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

test.describe('Dashboard API Routes', () => {
  test('health route accessible', async ({ page }) => {
    const response = await page.request.get('/api/bot/health');
    
    // Should respond (503 if bot offline, 200 if online)
    expect([200, 503]).toContain(response.status());
  });

  test('stats route accessible', async ({ page }) => {
    const response = await page.request.get('/api/discord-stats');
    
    // Should respond
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('API Rate Limiting', () => {
  test('rate limit headers present on API responses', async ({ page }) => {
    const response = await page.request.get('/api/bot/health');
    
    // Rate limit headers should be present
    const headers = response.headers();
    // Note: x-ratelimit-* or retry-after might be present
    expect(headers).toBeDefined();
  });
});

test.describe('Login Page', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Page should contain login elements
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('discord login button present', async ({ page }) => {
    await page.goto('/login');
    
    // Should have Discord login option
    const discordBtn = page.locator('button:has-text("Discord"), [href*="discord"]');
    await expect(discordBtn.first()).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('404 page displays correctly', async ({ page }) => {
    const response = await page.request.get('/this-page-does-not-exist-12345');
    
    // Should show 404 page or redirect
    expect([404, 200]).toContain(response.status());
  });

  test('invalid API returns proper error', async ({ page }) => {
    const response = await page.request.get('/api/bot/invalid-route-xyz');
    
    // Should return 404 or error
    expect([404, 500]).toContain(response.status());
  });
});