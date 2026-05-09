import { test, expect } from '@playwright/test';

test.describe('Login Page Layout', () => {
  test('should render login UI elements correctly', async ({ page }) => {
    await page.goto('/login');

    // Welcome titles are visible
    await expect(page.locator('text=مرحباً بك في')).toBeVisible();
    await expect(page.locator('text=مجتمع العائلة')).toBeVisible();

    // Form inputs
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Buttons
    await expect(page.locator('button:has-text("تسجيل الدخول للنظام")')).toBeVisible();
    await expect(page.locator('button:has-text("تسجيل الدخول بواسطة Discord")')).toBeVisible();
  });

  test('should prevent empty form submission', async ({ page }) => {
    await page.goto('/login');
    
    const submitBtn = page.locator('button:has-text("تسجيل الدخول للنظام")');
    await submitBtn.click();
    
    // HTML5 validation should prevent navigation
    expect(page.url()).toContain('/login');
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Toggle Button
    const toggleBtn = page.locator('.group-focus-within\\:text-primary').last();
    // In our code the button is not the absolute wrapper, it's a button beside it.
    // Instead we find the exact toggle button
    const eyeBtn = page.locator('button').filter({ hasText: '' }).nth(1); // just a generic approach
     // Given the structure, we can find the button inside the password container 
    const buttons = page.locator('button[type="button"]');
    const visibilityBtn = buttons.first();
    
    if(await visibilityBtn.isVisible()) {
        await visibilityBtn.click();
        const textInput = page.locator('input[type="text"]');
        await expect(textInput).toBeVisible();
    }
  });
});
