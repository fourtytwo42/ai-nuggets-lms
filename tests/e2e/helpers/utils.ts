import { Page, expect } from '@playwright/test';

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
) {
  return page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Wait for success message
 */
export async function waitForSuccessMessage(page: Page, message?: string) {
  const successLocator = page.locator('.bg-green-50, .text-green-600, [class*="success"]').first();
  await expect(successLocator).toBeVisible({ timeout: 5000 });
  
  if (message) {
    await expect(successLocator).toContainText(message);
  }
}

/**
 * Wait for error message
 */
export async function waitForErrorMessage(page: Page, message?: string) {
  const errorLocator = page.locator('.bg-red-50, .text-red-600, [class*="error"]').first();
  await expect(errorLocator).toBeVisible({ timeout: 5000 });
  
  if (message) {
    await expect(errorLocator).toContainText(message);
  }
}

/**
 * Fill form fields
 */
export async function fillForm(
  page: Page,
  fields: Record<string, string | boolean>
) {
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'boolean') {
      const checkbox = page.locator(`input[name="${name}"][type="checkbox"]`);
      if (await checkbox.isVisible()) {
        if (value) {
          await checkbox.check();
        } else {
          await checkbox.uncheck();
        }
      }
    } else {
      const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`);
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }
}

/**
 * Select dropdown option
 */
export async function selectOption(
  page: Page,
  selectName: string,
  optionValue: string
) {
  const select = page.locator(`select[name="${selectName}"]`);
  await select.selectOption(optionValue);
}

/**
 * Upload file
 */
export async function uploadFile(
  page: Page,
  inputSelector: string,
  filePath: string
) {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
}

