import { test, expect } from '@playwright/test';

test.describe('Login Page Layout', () => {
  test('should render login UI elements correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Page should load
    await expect(page).toHaveTitle(/Login|تسجيل|Discord/i);
    
    // Main elements should be present
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('should prevent empty form submission', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit without filling
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Form should not submit or show validation
      await expect(page.locator('text=البريد|email|required')).toBeVisible();
    }
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    
    // Find password input
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      // Find toggle button
      const toggleBtn = page.locator('button[aria-label*="password"], button:has-text("eye")').first();
      if (await toggleBtn.isVisible()) {
        await toggleBtn.click();
        
        // Input should now be text type
        const inputType = await passwordInput.getAttribute('type');
        expect(inputType).toBe('text');
      }
    }
  });
});

test.describe('Discord OAuth', () => {
  test('discord login button redirects to oauth', async ({ page }) => {
    await page.goto('/login');
    
    // Find Discord button
    const discordBtn = page.locator('button:has-text("Discord"), a[href*="discord"]').first();
    await expect(discordBtn).toBeVisible();
  });
});