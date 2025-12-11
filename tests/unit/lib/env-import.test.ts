// Test the import-time validation behavior
describe('Environment Validation on Import', () => {
  const originalEnv = process.env;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    });
  });

  it('should not throw in test environment', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
      configurable: true,
    });
    // Should not throw when importing
    expect(() => {
      require('@/src/lib/env');
    }).not.toThrow();
  });

  it('should log warning in development with invalid env', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });
    process.env.DATABASE_URL = 'invalid';
    process.env.JWT_SECRET = 'short';
    
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Import should not throw, just warn
    expect(() => {
      jest.resetModules();
      require('@/src/lib/env');
    }).not.toThrow();
    
    // Should have logged a warning
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });
});

