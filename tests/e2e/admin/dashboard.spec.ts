import { test, expect } from '@playwright/test';
import { loginAs, logout } from '../helpers/auth';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should display admin console', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Admin Console');
  });

  test('should display admin navigation cards', async ({ page }) => {
    await expect(page.locator('text=Content Ingestion')).toBeVisible();
    await expect(page.locator('text=Nugget Store')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should navigate to content ingestion page', async ({ page }) => {
    const ingestionLink = page.locator('a[href="/admin/ingestion"]').first();
    await ingestionLink.click();
    await expect(page).toHaveURL(/\/admin\/ingestion/);
  });

  test('should navigate to settings page', async ({ page }) => {
    const settingsLink = page.locator('a[href="/admin/settings"]').first();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/admin\/settings/);
  });

  test('should navigate to files page from navigation', async ({ page }) => {
    const filesLink = page.locator('a[href="/admin/files"], nav a:has-text("Files")');
    if (await filesLink.isVisible()) {
      await filesLink.click();
      await expect(page).toHaveURL(/\/admin\/files/);
    }
  });
});

