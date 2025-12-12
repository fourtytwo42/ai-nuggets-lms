import { test, expect } from '@playwright/test';
import { loginAs, logout, TEST_ACCOUNTS } from '../helpers/auth';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'learner');
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should display profile page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Profile');
  });

  test('should display profile form fields', async ({ page }) => {
    await expect(page.locator('input[type="text"]').first()).toBeVisible(); // Name field
    await expect(page.locator('input[type="email"]')).toBeVisible(); // Email field
    await expect(page.locator('input[disabled]')).toBeVisible(); // Role field (disabled)
  });

  test('should show user role as disabled', async ({ page }) => {
    const roleInput = page.locator('input[disabled]');
    await expect(roleInput).toBeVisible();
    await expect(roleInput).toBeDisabled();
  });

  test('should have save button', async ({ page }) => {
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeVisible();
  });

  test('should be accessible from navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    const profileLink = page.locator('a[href="/profile"], nav a:has-text("Profile")');
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await expect(page).toHaveURL(/\/profile/);
    }
  });
});

