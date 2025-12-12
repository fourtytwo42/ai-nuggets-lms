import { test, expect } from '@playwright/test';
import { loginAs, logout, isAuthenticated } from '../helpers/auth';

test.describe('Logout', () => {
  test('should logout learner user', async ({ page }) => {
    await loginAs(page, 'learner');
    
    // Verify logged in
    expect(await isAuthenticated(page)).toBe(true);
    
    // Logout
    await logout(page);
    
    // Verify logged out
    expect(await isAuthenticated(page)).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout admin user', async ({ page }) => {
    await loginAs(page, 'admin');
    
    // Verify logged in
    expect(await isAuthenticated(page)).toBe(true);
    
    // Logout
    await logout(page);
    
    // Verify logged out
    expect(await isAuthenticated(page)).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test('should clear localStorage on logout', async ({ page }) => {
    await loginAs(page, 'learner');
    
    // Verify token exists
    const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenBefore).toBeTruthy();
    
    // Logout
    await logout(page);
    
    // Verify token is cleared
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfter).toBeNull();
  });
});

