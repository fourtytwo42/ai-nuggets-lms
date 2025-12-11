# Testing Guide

Complete testing strategy and guide for the AI Microlearning LMS.

## Testing Strategy

### Test Types

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test component interactions and API endpoints
3. **E2E Tests** - Test complete user flows

### Coverage Requirements

- **Minimum:** 90% code coverage
- **Target:** 95%+ coverage
- **Critical Paths:** 100% coverage

### Test Pass Rate

- **Required:** 100% test pass rate before deployment
- **CI/CD:** All tests must pass in CI pipeline

## Running Tests

### All Tests

```bash
npm test
```

### With Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm test -- --watch
```

### Specific Test File

```bash
npm test -- path/to/test/file.test.ts
```

### E2E Tests

```bash
npm run test:e2e
```

## Test Structure

```
tests/
├── unit/
│   ├── services/
│   ├── lib/
│   ├── components/
│   └── utils/
├── integration/
│   ├── api/
│   └── services/
└── e2e/
    └── flows/
```

## Unit Tests

### Example: Service Test

```typescript
import { TextExtractor } from '@/src/services/content-ingestion/extraction';

describe('TextExtractor', () => {
  it('should extract text from PDF', async () => {
    const extractor = new TextExtractor();
    const text = await extractor.extractFromPDF('test.pdf');
    expect(text).toContain('expected content');
  });
});
```

### Example: Utility Test

```typescript
import { hashPassword, comparePassword } from '@/src/lib/auth/password';

describe('Password utilities', () => {
  it('should hash password', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should compare password correctly', async () => {
    const hash = await hashPassword('password123');
    const match = await comparePassword('password123', hash);
    expect(match).toBe(true);
  });
});
```

## Integration Tests

### Example: API Endpoint Test

```typescript
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  it('should authenticate user', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });
});
```

### Example: Database Integration Test

```typescript
import { prisma } from '@/src/lib/db/prisma';

describe('Database operations', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({});
  });

  it('should create user', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        role: 'learner',
        organizationId: 'org-id',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

## E2E Tests

### Example: User Flow Test

```typescript
import { test, expect } from '@playwright/test';

test('complete learning session flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'learner@test.com');
  await page.fill('input[name="password"]', 'learner123');
  await page.click('button[type="submit"]');

  // Navigate to learning
  await page.click('text=Learning');
  await expect(page).toHaveURL('/learning');

  // Start session
  await page.click('text=Start Learning');

  // Send message
  await page.fill('textarea[name="message"]', 'Hello');
  await page.click('button[type="submit"]');

  // Verify response
  await expect(page.locator('.message')).toContainText('response');
});
```

## Mocking

### Mock External APIs

```typescript
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
}));
```

### Mock File System

```typescript
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('file content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));
```

## Test Data

### Fixtures

Create reusable test data:

```typescript
// tests/fixtures/users.ts
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
  },
  learner: {
    email: 'learner@test.com',
    password: 'learner123',
    role: 'learner',
  },
};
```

### Database Seeding

```typescript
// tests/setup/seed.ts
export async function seedTestData() {
  await prisma.organization.create({
    data: {
      id: 'test-org',
      name: 'Test Organization',
    },
  });
  // ... more seed data
}
```

## Best Practices

1. **Isolation:** Each test should be independent
2. **Cleanup:** Clean up test data after tests
3. **Mocking:** Mock external services and APIs
4. **Coverage:** Aim for 90%+ coverage
5. **Naming:** Use descriptive test names
6. **Organization:** Group related tests together

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Troubleshooting

**Tests failing:**

- Check test database is set up
- Verify environment variables
- Check mock implementations

**Coverage low:**

- Add tests for uncovered code
- Check coverage report for gaps
- Focus on critical paths first

**Slow tests:**

- Use test database instead of production
- Mock expensive operations
- Run tests in parallel

## Related Documentation

- [Implementation Status](IMPLEMENTATION_STATUS.md) - Current test coverage
- [Architecture Overview](ARCHITECTURE.md) - System design
