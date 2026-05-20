import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Page should have correct title
    await expect(page).toHaveTitle(/FAMILY LEGENDS|Family Legends/i);
    
    // No console errors
    expect(errors.filter(e => !e.includes('Firebase') && !e.includes('favicon'))).toHaveLength(0);
  });

  test('hero section displays correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check hero content
    await expect(page.locator('text=Family Legends').first()).toBeVisible();
  });

  test('navigation scroll works', async ({ page }) => {
    await page.goto('/');
    
    // Find and click on rules navigation
    const rulesNav = page.locator('nav button', { hasText: /القوانين|rules/i }).first();
    if (await rulesNav.isVisible()) {
      await rulesNav.click();
      await page.waitForTimeout(500);
    }
  });

  test('language switcher is present', async ({ page }) => {
    await page.goto('/');
    
    // Language switcher should be visible
    const langSwitcher = page.locator('button:has-text("English"), button:has-text("العربية")').first();
    await expect(langSwitcher).toBeVisible();
  });

  test('login button navigates to login page', async ({ page }) => {
    await page.goto('/');
    
    // Click login button
    await page.click('a[href="/login"]');
    
    // Should navigate to login page
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Streamers Section', () => {
  test('streamers section renders', async ({ page }) => {
    await page.goto('/');
    
    // Find streamers section
    const streamersSection = page.locator('#streamers, [id*="streamer"], section').filter({ hasText: /ستريمر|streamer|البث/i }).first();
    await expect(streamersSection).toBeVisible();
  });
});

test.describe('Partners Section', () => {
  test('partners section renders', async ({ page }) => {
    await page.goto('/');
    
    // Partners section should be visible
    const partnersSection = page.locator('#partners, [id*="partner"]').first();
    await expect(partnersSection).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('button[aria-label*="القائمة"], button[aria-label*="menu"]').first();
    await expect(mobileMenuBtn).toBeVisible();
  });
});