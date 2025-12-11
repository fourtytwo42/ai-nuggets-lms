import { prisma } from '@/src/lib/db/prisma';

describe('Prisma Client', () => {
  it('should export a prisma client instance', () => {
    expect(prisma).toBeDefined();
    // Check that it's an object with expected structure
    expect(typeof prisma).toBe('object');
    expect(prisma).not.toBeNull();
  });
});

