import { Page } from '@playwright/test';

export const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  learner: {
    email: 'learner@test.com',
    password: 'learner123',
    name: 'Test Learner',
    role: 'learner',
  },
  learner2: {
    email: 'user@test.com',
    password: 'user123',
    name: 'John Doe',
    role: 'learner',
  },
};

/**
 * Login as a specific user type
 */
export async function loginAs(page: Page, account: keyof typeof TEST_ACCOUNTS) {
  const user = TEST_ACCOUNTS[account];
  
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Click on demo account if available
  const demoAccountButton = page.locator(`button:has-text("${user.name}")`).first();
  if (await demoAccountButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await demoAccountButton.click();
    await page.waitForTimeout(500); // Wait for form to fill
  } else {
    // Fallback to manual entry
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
  }
  
  await page.click('button[type="submit"]');
  
  // Wait for navigation - be more flexible with URL matching
  try {
    await page.waitForURL(/^\/(admin|dashboard)/, { timeout: 15000 });
  } catch {
    // If URL doesn't match, check if we're logged in anyway
    const token = await page.evaluate(() => localStorage.getItem('token'));
    if (!token) {
      throw new Error(`Failed to login as ${account} - no token found`);
    }
    // If we have a token, we're logged in even if URL is different
  }
  
  // Verify we're logged in
  const token = await page.evaluate(() => localStorage.getItem('token'));
  if (!token) {
    throw new Error(`Failed to login as ${account}`);
  }
  
  // Wait a bit for page to settle
  await page.waitForTimeout(1000);
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Try to find logout button in navigation
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")').first();
  
  if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});
  } else {
    // Fallback: clear localStorage and navigate to login
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.goto('/login');
  }
  
  // Wait for login page to be ready
  await page.waitForLoadState('networkidle');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!localStorage.getItem('token');
  });
}

/**
 * Get current user from localStorage
 */
export async function getCurrentUser(page: Page) {
  return await page.evaluate(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
}

