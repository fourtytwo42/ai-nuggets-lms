# End-to-End (E2E) Tests

This directory contains comprehensive Playwright end-to-end tests for all client-side functionality in the AI Microlearning LMS.

## Test Structure

```
tests/e2e/
├── helpers/
│   ├── auth.ts          # Authentication helpers (login, logout, test accounts)
│   └── utils.ts         # Utility functions (form filling, waiting, etc.)
├── public/
│   ├── splash.spec.ts   # Splash page tests
│   ├── login.spec.ts    # Login page tests
│   └── register.spec.ts # Registration page tests
├── learner/
│   ├── dashboard.spec.ts # Learner dashboard tests
│   ├── learning.spec.ts  # Learning page tests
│   ├── profile.spec.ts   # Profile page tests
│   └── logout.spec.ts    # Logout functionality tests
└── admin/
    ├── dashboard.spec.ts      # Admin dashboard tests
    ├── ingestion.spec.ts      # Content ingestion tests
    ├── files.spec.ts          # File management tests
    ├── settings.spec.ts       # Settings page tests
    └── authentication.spec.ts # Admin auth & authorization tests
```

## Test Coverage

### Public Pages (No Authentication Required)
- ✅ Splash page navigation and content
- ✅ Login page functionality
- ✅ Registration page functionality
- ✅ Demo account selection
- ✅ Form validation

### Learner Functions
- ✅ Dashboard display and navigation
- ✅ Learning page access
- ✅ Profile page display
- ✅ Logout functionality
- ✅ Protected route access

### Admin Functions
- ✅ Admin dashboard navigation
- ✅ Content ingestion management
  - Watched folders (add, enable/disable, delete)
  - Monitored URLs (add, enable/disable, delete)
  - Ingestion jobs display
- ✅ File management
  - File upload
  - File listing
  - File preview
  - File deletion
- ✅ Settings management
  - AI model configuration
  - Voice settings
  - System settings
  - API key management
- ✅ Authentication & authorization
  - Admin-only route protection
  - Session management

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Suite
```bash
# Public pages
npx playwright test tests/e2e/public

# Learner tests
npx playwright test tests/e2e/learner

# Admin tests
npx playwright test tests/e2e/admin
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/public/login.spec.ts
```

### Run Tests in UI Mode
```bash
npx playwright test --ui
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

### Run Tests with Specific Browser
```bash
npx playwright test --project=chromium
```

## Test Accounts

The tests use seeded test accounts:

- **Admin**: `admin@test.com` / `admin123`
- **Learner 1**: `learner@test.com` / `learner123`
- **Learner 2**: `user@test.com` / `user123`

These accounts are created by running:
```bash
npm run db:seed
```

## Helper Functions

### Authentication Helpers (`helpers/auth.ts`)

- `loginAs(page, account)` - Login as a specific user type
- `logout(page)` - Logout from the application
- `isAuthenticated(page)` - Check if user is authenticated
- `getCurrentUser(page)` - Get current user from localStorage

### Utility Helpers (`helpers/utils.ts`)

- `waitForAPIResponse(page, urlPattern)` - Wait for API response
- `waitForSuccessMessage(page, message?)` - Wait for success message
- `waitForErrorMessage(page, message?)` - Wait for error message
- `fillForm(page, fields)` - Fill form fields
- `selectOption(page, selectName, optionValue)` - Select dropdown option
- `uploadFile(page, inputSelector, filePath)` - Upload a file

## Test Environment Setup

1. **Database**: Ensure PostgreSQL is running with seeded data
2. **Redis**: Ensure Redis is running (for job queue)
3. **Application**: The test runner will start the dev server automatically
4. **Test Data**: Run `npm run db:seed` to create test accounts

## Writing New Tests

When adding new functionality, follow these patterns:

### 1. Create Test File
```typescript
import { test, expect } from '@playwright/test';
import { loginAs, logout } from '../helpers/auth';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin'); // or 'learner'
    await page.goto('/feature-path');
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### 2. Use Helpers
Always use helper functions for common operations:
- Authentication: `loginAs()`, `logout()`
- Form filling: `fillForm()`
- Waiting: `waitForSuccessMessage()`, `waitForErrorMessage()`

### 3. Test Structure
- Use `test.describe()` to group related tests
- Use `test.beforeEach()` for setup
- Use `test.afterEach()` for cleanup
- Keep tests independent and isolated

## CI/CD Integration

Tests are configured to run in CI environments:
- Retries: 2 attempts on failure
- Workers: 1 (sequential execution)
- Screenshots: On failure
- Videos: Retained on failure
- Traces: On first retry

## Debugging Failed Tests

1. **View HTML Report**:
   ```bash
   npx playwright show-report
   ```

2. **View Screenshots**:
   Screenshots are saved in `test-results/` directory

3. **View Videos**:
   Videos are saved in `test-results/` directory

4. **Run in Debug Mode**:
   ```bash
   npx playwright test --debug
   ```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always logout and clean up in `afterEach`
3. **Waiting**: Use proper wait conditions, not arbitrary timeouts
4. **Selectors**: Prefer stable selectors (data-testid, role, text)
5. **Assertions**: Use meaningful assertions with clear error messages

## Known Issues

- Some tests may require specific data in the database
- File upload tests create temporary files that are cleaned up
- Some admin tests may fail if API keys are not configured (expected)

## Maintenance

- Update test accounts if seed script changes
- Update helpers when common patterns change
- Add new test files for new features
- Keep test descriptions clear and descriptive

