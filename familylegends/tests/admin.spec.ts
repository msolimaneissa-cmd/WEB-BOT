import { test, expect, chromium, request } from '@playwright/test';

const WEB_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:9002';
const BOT_URL = process.env.BOT_INTERNAL_URL || 'http://localhost:3001';

// Skip all tests if server is not available
test.beforeAll(async () => {
  const context = await chromium.requestBrowser({ baseURL: WEB_URL });
  try {
    const response = await request.newRequest({ url: WEB_URL, method: 'GET' });
    if (!response.ok && response.status() !== 404) {
      console.log(`⚠️ Web server not available at ${WEB_URL}`);
    }
  } catch (e) {
    console.log(`⚠️ Web server connection failed: ${e.message}`);
  }
});

test.describe('Admin Dashboard', () => {
  test('unauthorized users see login prompt', async ({ page }) => {
    await page.goto('/admin');
    
    // Should show login prompt
    await expect(page.locator('text=لوحة الإدارة')).toBeVisible();
    await expect(page.locator('text=يجب تسجيل الدخول عبر ديسكورد')).toBeVisible();
    
    // Login button should be present
    await expect(page.locator('button:has-text("تسجيل الدخول عبر ديسكورد")')).toBeVisible();
  });

  test('admin page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/admin');
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // No critical console errors (filter out expected auth errors)
    const criticalErrors = errors.filter(e => 
      !e.includes('Firebase') && 
      !e.includes('favicon') &&
      !e.includes('401') &&
      !e.includes('unauthorized')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Admin Tabs Navigation', () => {
  test('tabs are present and clickable', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(500);
    
    // Find tabs (they might be hidden behind login)
    const tabs = page.locator('[role="tab"], button:has-text("الإعدادات"), button:has-text("الحلفاء")');
    
    // At least some tabs should be visible or in the DOM
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
  });
});

test.describe('Admin Dialogs', () => {
  test('login with discord button exists', async ({ page }) => {
    await page.goto('/admin');
    
    const discordLoginBtn = page.locator('button:has-text("ديسكورد"), button:has-text("Discord")');
    await expect(discordLoginBtn.first()).toBeVisible();
  });
});

test.describe('Admin Layout', () => {
  test('header is visible', async ({ page }) => {
    await page.goto('/admin');
    
    // Admin header should be present
    const header = page.locator('header, [class*="header"], nav').first();
    await expect(header).toBeVisible();
  });

  test('main content area exists', async ({ page }) => {
    await page.goto('/admin');
    
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});