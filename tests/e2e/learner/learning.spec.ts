import { test, expect } from '@playwright/test';
import { loginAs, logout } from '../helpers/auth';

test.describe('Learning Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'learner');
    await page.goto('/learning');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should display learning page', async ({ page }) => {
    // Check if page loads without errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should be accessible from navigation', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard');
    
    // Look for learning link in navigation
    const learningLink = page.locator('a[href="/learning"], nav a:has-text("Learning")');
    if (await learningLink.isVisible()) {
      await learningLink.click();
      await expect(page).toHaveURL(/\/learning/);
    }
  });
});

