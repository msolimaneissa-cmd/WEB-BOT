import { test, expect } from '@playwright/test';

test('landing page has title and main sections', async ({ page }) => {
  await page.goto('/');

  // Check title
  await expect(page).toHaveTitle(/FAMILY LEGENDS/i);

  // Check main sections exist
  await expect(page.locator('#stats')).toBeVisible();
  await expect(page.locator('#rules')).toBeVisible();
  await expect(page.locator('#games')).toBeVisible();
  await expect(page.locator('#team')).toBeVisible();
  await expect(page.locator('#streamers')).toBeVisible();
  await expect(page.locator('#partners')).toBeVisible();
});

test('navigation links work', async ({ page }) => {
  await page.goto('/');
  
  // Click on "القوانين"
  await page.click('text=القوانين');
  
  // URL should contain #rules
  expect(page.url()).toContain('#rules');
});
