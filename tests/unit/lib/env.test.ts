import { validateEnv } from '@/src/lib/env';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate correct environment variables', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(32); // At least 32 characters
    
    expect(() => validateEnv()).not.toThrow();
  });

  it('should throw error for missing DATABASE_URL', () => {
    delete process.env.DATABASE_URL;
    process.env.JWT_SECRET = 'a'.repeat(32);
    
    expect(() => validateEnv()).toThrow('Environment validation failed');
  });

  it('should throw error for short JWT_SECRET', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'short';
    
    expect(() => validateEnv()).toThrow('JWT_SECRET must be at least 32 characters');
  });

  it('should use default values for optional variables', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    
    const env = validateEnv();
    expect(env.REDIS_HOST).toBe('localhost');
    expect(env.REDIS_PORT).toBe('6379');
  });

  it('should handle invalid DATABASE_URL format', () => {
    process.env.DATABASE_URL = 'not-a-valid-url';
    process.env.JWT_SECRET = 'a'.repeat(32);
    
    expect(() => validateEnv()).toThrow('Environment validation failed');
  });

  it('should handle invalid NODE_ENV', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.JWT_SECRET = 'a'.repeat(32);
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'invalid',
      writable: true,
      configurable: true,
    });
    
    expect(() => validateEnv()).toThrow('Environment validation failed');
  });
});

