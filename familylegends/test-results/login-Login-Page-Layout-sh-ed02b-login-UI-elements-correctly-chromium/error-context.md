# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login Page Layout >> should render login UI elements correctly
- Location: tests\login.spec.ts:4:7

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
  3  | test.describe('Login Page Layout', () => {
  4  |   test('should render login UI elements correctly', async ({ page }) => {
> 5  |     await page.goto('/login');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:9002/login
  6  | 
  7  |     // Welcome titles are visible
  8  |     await expect(page.locator('text=مرحباً بك في')).toBeVisible();
  9  |     await expect(page.locator('text=مجتمع العائلة')).toBeVisible();
  10 | 
  11 |     // Form inputs
  12 |     const emailInput = page.locator('input[type="email"]');
  13 |     const passwordInput = page.locator('input[type="password"]');
  14 |     await expect(emailInput).toBeVisible();
  15 |     await expect(passwordInput).toBeVisible();
  16 | 
  17 |     // Buttons
  18 |     await expect(page.locator('button:has-text("تسجيل الدخول للنظام")')).toBeVisible();
  19 |     await expect(page.locator('button:has-text("تسجيل الدخول بواسطة Discord")')).toBeVisible();
  20 |   });
  21 | 
  22 |   test('should prevent empty form submission', async ({ page }) => {
  23 |     await page.goto('/login');
  24 |     
  25 |     const submitBtn = page.locator('button:has-text("تسجيل الدخول للنظام")');
  26 |     await submitBtn.click();
  27 |     
  28 |     // HTML5 validation should prevent navigation
  29 |     expect(page.url()).toContain('/login');
  30 |   });
  31 | 
  32 |   test('should toggle password visibility', async ({ page }) => {
  33 |     await page.goto('/login');
  34 |     
  35 |     const passwordInput = page.locator('input[type="password"]');
  36 |     await expect(passwordInput).toBeVisible();
  37 |     
  38 |     // Toggle Button
  39 |     const toggleBtn = page.locator('.group-focus-within\\:text-primary').last();
  40 |     // In our code the button is not the absolute wrapper, it's a button beside it.
  41 |     // Instead we find the exact toggle button
  42 |     const eyeBtn = page.locator('button').filter({ hasText: '' }).nth(1); // just a generic approach
  43 |      // Given the structure, we can find the button inside the password container 
  44 |     const buttons = page.locator('button[type="button"]');
  45 |     const visibilityBtn = buttons.first();
  46 |     
  47 |     if(await visibilityBtn.isVisible()) {
  48 |         await visibilityBtn.click();
  49 |         const textInput = page.locator('input[type="text"]');
  50 |         await expect(textInput).toBeVisible();
  51 |     }
  52 |   });
  53 | });
  54 | 
```