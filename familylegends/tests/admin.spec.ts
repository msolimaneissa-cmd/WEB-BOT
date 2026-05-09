import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Authorization', () => {
  test('unauthorized users should see login prompt', async ({ page }) => {
    // Go to admin without an active next-auth session
    await page.goto('/admin');
    
    // Check for unauthorized access view
    await expect(page.locator('text=لوحة الإدارة')).toBeVisible();
    await expect(page.locator('text=يجب تسجيل الدخول عبر ديسكورد للوصول إلى لوحة التحكم')).toBeVisible();
    await expect(page.locator('button:has-text("تسجيل الدخول عبر ديسكورد")')).toBeVisible();

    // Wait for the icon too
    const icon = page.locator('.w-10.h-10.text-primary');
    await expect(icon).toBeVisible();
  });
});
