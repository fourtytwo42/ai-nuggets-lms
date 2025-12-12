import { test, expect } from '@playwright/test';
import { loginAs, logout, isAuthenticated } from '../helpers/auth';

test.describe('Admin Authentication & Authorization', () => {
  test('should redirect learner to dashboard, not admin', async ({ page }) => {
    await loginAs(page, 'learner');
    
    // Try to access admin page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should either redirect or show access denied
    const url = page.url();
    const isAdminPage = url.includes('/admin');
    const isDashboard = url.includes('/dashboard');
    
    // Learner should not be able to access admin pages
    // Either redirected to dashboard or shown error
    expect(isDashboard || !isAdminPage).toBe(true);
  });

  test('should allow admin to access admin pages', async ({ page }) => {
    await loginAs(page, 'admin');
    
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    
    await page.goto('/admin/settings');
    await expect(page).toHaveURL(/\/admin\/settings/);
    
    await page.goto('/admin/files');
    await expect(page).toHaveURL(/\/admin\/files/);
    
    await logout(page);
  });

  test('should protect admin routes from unauthenticated users', async ({ page }) => {
    // Clear any existing auth
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session across page navigations', async ({ page }) => {
    await loginAs(page, 'admin');
    
    // Navigate to multiple pages
    await page.goto('/admin');
    expect(await isAuthenticated(page)).toBe(true);
    
    await page.goto('/admin/settings');
    expect(await isAuthenticated(page)).toBe(true);
    
    await page.goto('/admin/files');
    expect(await isAuthenticated(page)).toBe(true);
    
    await logout(page);
  });
});

