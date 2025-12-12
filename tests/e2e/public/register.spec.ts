import { test, expect } from '@playwright/test';
import { logout } from '../helpers/auth';

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Create your account');
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="organizationName"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should fill and submit registration form', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.fill('input[name="organizationName"]', 'Test Org');
    
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard after successful registration
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify user is logged in
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    
    // Cleanup: logout
    await logout(page);
  });

  test('should show error for invalid email', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'testpassword123');
    
    const emailInput = page.locator('input[name="email"]');
    const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
  });

  test('should show error for short password', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'short');
    
    const passwordInput = page.locator('input[name="password"]');
    const minLength = await passwordInput.getAttribute('minLength');
    expect(minLength).toBeTruthy();
  });

  test('should navigate to login page', async ({ page }) => {
    const loginLink = page.locator('a:has-text("sign in to existing account")');
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    // Try to register with existing email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'testpassword123');
    
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.bg-red-50, .text-red-600')).toBeVisible({ timeout: 5000 });
  });
});

