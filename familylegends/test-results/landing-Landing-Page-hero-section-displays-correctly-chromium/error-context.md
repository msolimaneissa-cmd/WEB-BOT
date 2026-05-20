# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing Page >> hero section displays correctly
- Location: tests\landing.spec.ts:22:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/
Call log:
  - navigating to "http://localhost:9002/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Landing Page', () => {
  4  |   test('page loads without errors', async ({ page }) => {
  5  |     // Listen for console errors
  6  |     const errors: string[] = [];
  7  |     page.on('console', msg => {
  8  |       if (msg.type() === 'error') {
  9  |         errors.push(msg.text());
  10 |       }
  11 |     });
  12 | 
  13 |     await page.goto('/');
  14 |     
  15 |     // Page should have correct title
  16 |     await expect(page).toHaveTitle(/FAMILY LEGENDS|Family Legends/i);
  17 |     
  18 |     // No console errors
  19 |     expect(errors.filter(e => !e.includes('Firebase') && !e.includes('favicon'))).toHaveLength(0);
  20 |   });
  21 | 
  22 |   test('hero section displays correctly', async ({ page }) => {
> 23 |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/
  24 |     
  25 |     // Check hero content
  26 |     await expect(page.locator('text=Family Legends').first()).toBeVisible();
  27 |   });
  28 | 
  29 |   test('navigation scroll works', async ({ page }) => {
  30 |     await page.goto('/');
  31 |     
  32 |     // Find and click on rules navigation
  33 |     const rulesNav = page.locator('nav button', { hasText: /القوانين|rules/i }).first();
  34 |     if (await rulesNav.isVisible()) {
  35 |       await rulesNav.click();
  36 |       // Wait for scroll animation
  37 |       await page.waitForTimeout(500);
  38 |     }
  39 |   });
  40 | 
  41 |   test('language switcher is present', async ({ page }) => {
  42 |     await page.goto('/');
  43 |     
  44 |     // Language switcher should be visible
  45 |     const langSwitcher = page.locator('button:has-text("English"), button:has-text("العربية")').first();
  46 |     await expect(langSwitcher).toBeVisible();
  47 |   });
  48 | 
  49 |   test('login button navigates to login page', async ({ page }) => {
  50 |     await page.goto('/');
  51 |     
  52 |     // Click login button
  53 |     await page.click('a[href="/login"]');
  54 |     
  55 |     // Should navigate to login page
  56 |     await expect(page).toHaveURL(/\/login/);
  57 |   });
  58 | });
  59 | 
  60 | test.describe('Streamers Section', () => {
  61 |   test('streamers section renders', async ({ page }) => {
  62 |     await page.goto('/');
  63 |     
  64 |     // Find streamers section
  65 |     const streamersSection = page.locator('#streamers, [id*="streamer"], section').filter({ hasText: /ستريمر|streamer|البث/i }).first();
  66 |     await expect(streamersSection).toBeVisible();
  67 |   });
  68 | });
  69 | 
  70 | test.describe('Partners Section', () => {
  71 |   test('partners section renders', async ({ page }) => {
  72 |     await page.goto('/');
  73 |     
  74 |     // Partners section should be visible
  75 |     const partnersSection = page.locator('#partners, [id*="partner"]').first();
  76 |     await expect(partnersSection).toBeVisible();
  77 |   });
  78 | });
  79 | 
  80 | test.describe('Responsive Design', () => {
  81 |   test('works on mobile viewport', async ({ page }) => {
  82 |     await page.setViewportSize({ width: 375, height: 667 });
  83 |     await page.goto('/');
  84 |     
  85 |     // Mobile menu button should be visible
  86 |     const mobileMenuBtn = page.locator('button[aria-label*="القائمة"], button[aria-label*="menu"]').first();
  87 |     await expect(mobileMenuBtn).toBeVisible();
  88 |   });
  89 | });
```