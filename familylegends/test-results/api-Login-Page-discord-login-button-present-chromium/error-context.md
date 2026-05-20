# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api.spec.ts >> Login Page >> discord login button present
- Location: tests\api.spec.ts:61:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/login
Call log:
  - navigating to "http://localhost:9002/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Note: These tests require the bot to be running
  4  | // Set BOT_URL environment variable to test against local bot
  5  | 
  6  | const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:3001';
  7  | 
  8  | test.describe('Bot Health API', () => {
  9  |   test('bot status endpoint responds', async ({ request }) => {
  10 |     // Test if bot server is reachable
  11 |     const response = await request.get(`${BOT_URL}/ping`);
  12 |     
  13 |     // Should get some response (200 or 401)
  14 |     expect([200, 401, 404]).toContain(response.status());
  15 |   });
  16 | 
  17 |   test('bot root endpoint returns status', async ({ request }) => {
  18 |     const response = await request.get(`${BOT_URL}/`);
  19 |     
  20 |     // Should return JSON status
  21 |     expect(response.headers()['content-type']).toContain('application/json');
  22 |   });
  23 | });
  24 | 
  25 | test.describe('Dashboard API Routes', () => {
  26 |   test('health route accessible', async ({ page }) => {
  27 |     const response = await page.request.get('/api/bot/health');
  28 |     
  29 |     // Should respond (503 if bot offline, 200 if online)
  30 |     expect([200, 503]).toContain(response.status());
  31 |   });
  32 | 
  33 |   test('stats route accessible', async ({ page }) => {
  34 |     const response = await page.request.get('/api/discord-stats');
  35 |     
  36 |     // Should respond
  37 |     expect(response.status()).toBeGreaterThanOrEqual(200);
  38 |     expect(response.status()).toBeLessThan(500);
  39 |   });
  40 | });
  41 | 
  42 | test.describe('API Rate Limiting', () => {
  43 |   test('rate limit headers present on API responses', async ({ page }) => {
  44 |     const response = await page.request.get('/api/bot/health');
  45 |     
  46 |     // Rate limit headers should be present
  47 |     const headers = response.headers();
  48 |     // Note: x-ratelimit-* or retry-after might be present
  49 |     expect(headers).toBeDefined();
  50 |   });
  51 | });
  52 | 
  53 | test.describe('Login Page', () => {
  54 |   test('login page loads correctly', async ({ page }) => {
  55 |     await page.goto('/login');
  56 |     
  57 |     // Page should contain login elements
  58 |     await expect(page.locator('body')).not.toBeEmpty();
  59 |   });
  60 | 
  61 |   test('discord login button present', async ({ page }) => {
> 62 |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/login
  63 |     
  64 |     // Should have Discord login option
  65 |     const discordBtn = page.locator('button:has-text("Discord"), [href*="discord"]');
  66 |     await expect(discordBtn.first()).toBeVisible();
  67 |   });
  68 | });
  69 | 
  70 | test.describe('Error Handling', () => {
  71 |   test('404 page displays correctly', async ({ page }) => {
  72 |     const response = await page.request.get('/this-page-does-not-exist-12345');
  73 |     
  74 |     // Should show 404 page or redirect
  75 |     expect([404, 200]).toContain(response.status());
  76 |   });
  77 | 
  78 |   test('invalid API returns proper error', async ({ page }) => {
  79 |     const response = await page.request.get('/api/bot/invalid-route-xyz');
  80 |     
  81 |     // Should return 404 or error
  82 |     expect([404, 500]).toContain(response.status());
  83 |   });
  84 | });
```