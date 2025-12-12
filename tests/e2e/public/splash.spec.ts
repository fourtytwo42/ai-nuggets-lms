import { test, expect } from '@playwright/test';

test.describe('Splash Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display splash page with title and tagline', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('AI Microlearning LMS');
    await expect(page.locator('text=Zero-human-authoring adaptive microlearning platform')).toBeVisible();
  });

  test('should have navigation buttons', async ({ page }) => {
    const signInButton = page.locator('a:has-text("Sign In"), button:has-text("Sign In")');
    const getStartedButton = page.locator('a:has-text("Get Started"), button:has-text("Get Started")');
    
    await expect(signInButton).toBeVisible();
    await expect(getStartedButton).toBeVisible();
  });

  test('should navigate to login page when clicking Sign In', async ({ page }) => {
    const signInButton = page.locator('a:has-text("Sign In"), button:has-text("Sign In")').first();
    await signInButton.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should navigate to register page when clicking Get Started', async ({ page }) => {
    const getStartedButton = page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first();
    await getStartedButton.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should have black background', async ({ page }) => {
    const body = page.locator('body, div').first();
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    // Check if background is black or very dark
    expect(bgColor).toMatch(/rgb\(0,\s*0,\s*0\)|rgba\(0,\s*0,\s*0/);
  });
});

