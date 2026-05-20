# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Layout >> main content area exists
- Location: tests\admin.spec.ts:71:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/admin
Call log:
  - navigating to "http://localhost:9002/admin", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Admin Dashboard', () => {
  4  |   test('unauthorized users see login prompt', async ({ page }) => {
  5  |     await page.goto('/admin');
  6  |     
  7  |     // Should show login prompt
  8  |     await expect(page.locator('text=لوحة الإدارة')).toBeVisible();
  9  |     await expect(page.locator('text=يجب تسجيل الدخول عبر ديسكورد')).toBeVisible();
  10 |     
  11 |     // Login button should be present
  12 |     await expect(page.locator('button:has-text("تسجيل الدخول عبر ديسكورد")')).toBeVisible();
  13 |   });
  14 | 
  15 |   test('admin page loads without errors', async ({ page }) => {
  16 |     const errors: string[] = [];
  17 |     page.on('console', msg => {
  18 |       if (msg.type() === 'error') {
  19 |         errors.push(msg.text());
  20 |       }
  21 |     });
  22 | 
  23 |     await page.goto('/admin');
  24 |     
  25 |     // Wait for page to load
  26 |     await page.waitForTimeout(1000);
  27 |     
  28 |     // No critical console errors (filter out expected auth errors)
  29 |     const criticalErrors = errors.filter(e => 
  30 |       !e.includes('Firebase') && 
  31 |       !e.includes('favicon') &&
  32 |       !e.includes('401') &&
  33 |       !e.includes('unauthorized')
  34 |     );
  35 |     expect(criticalErrors).toHaveLength(0);
  36 |   });
  37 | });
  38 | 
  39 | test.describe('Admin Tabs Navigation', () => {
  40 |   test('tabs are present and clickable', async ({ page }) => {
  41 |     await page.goto('/admin');
  42 |     await page.waitForTimeout(500);
  43 |     
  44 |     // Find tabs (they might be hidden behind login)
  45 |     const tabs = page.locator('[role="tab"], button:has-text("الإعدادات"), button:has-text("الحلفاء")');
  46 |     
  47 |     // At least some tabs should be visible or in the DOM
  48 |     const tabCount = await tabs.count();
  49 |     expect(tabCount).toBeGreaterThan(0);
  50 |   });
  51 | });
  52 | 
  53 | test.describe('Admin Dialogs', () => {
  54 |   test('login with discord button exists', async ({ page }) => {
  55 |     await page.goto('/admin');
  56 |     
  57 |     const discordLoginBtn = page.locator('button:has-text("ديسكورد"), button:has-text("Discord")');
  58 |     await expect(discordLoginBtn.first()).toBeVisible();
  59 |   });
  60 | });
  61 | 
  62 | test.describe('Admin Layout', () => {
  63 |   test('header is visible', async ({ page }) => {
  64 |     await page.goto('/admin');
  65 |     
  66 |     // Admin header should be present
  67 |     const header = page.locator('header, [class*="header"], nav').first();
  68 |     await expect(header).toBeVisible();
  69 |   });
  70 | 
  71 |   test('main content area exists', async ({ page }) => {
> 72 |     await page.goto('/admin');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/admin
  73 |     
  74 |     const mainContent = page.locator('main');
  75 |     await expect(mainContent).toBeVisible();
  76 |   });
  77 | });
```