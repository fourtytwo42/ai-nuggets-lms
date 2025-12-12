import { test, expect } from '@playwright/test';
import { loginAs, TEST_ACCOUNTS, logout } from '../helpers/auth';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Sign in to your account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display demo accounts section', async ({ page }) => {
    await expect(page.locator('text=Demo Accounts')).toBeVisible();
    
    // Check for all three demo accounts
    for (const account of Object.values(TEST_ACCOUNTS)) {
      await expect(page.locator(`text=${account.name}`)).toBeVisible();
      await expect(page.locator(`text=${account.email}`)).toBeVisible();
    }
  });

  test('should fill credentials when clicking demo account', async ({ page }) => {
    const adminButton = page.locator('button:has-text("Admin User")').first();
    await adminButton.click();
    
    await page.waitForTimeout(300);
    
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toHaveValue(TEST_ACCOUNTS.admin.email);
    await expect(passwordInput).toHaveValue(TEST_ACCOUNTS.admin.password);
  });

  test('should login successfully with admin credentials', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/admin/);
    
    const user = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    
    expect(user).toBeTruthy();
    expect(user.role).toBe('admin');
  });

  test('should login successfully with learner credentials', async ({ page }) => {
    await loginAs(page, 'learner');
    await expect(page).toHaveURL(/\/dashboard/);
    
    const user = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
    
    expect(user).toBeTruthy();
    expect(user.role).toBe('learner');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.bg-red-50, .text-red-600')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    const registerLink = page.locator('a:has-text("create a new account")');
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should require email and password', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    // Try to submit empty form
    await submitButton.click();
    
    // HTML5 validation should prevent submission
    const emailRequired = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    const passwordRequired = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valueMissing);
    
    expect(emailRequired).toBe(true);
    expect(passwordRequired).toBe(true);
  });
});

