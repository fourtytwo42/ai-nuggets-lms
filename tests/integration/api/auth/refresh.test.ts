import { POST } from '@/app/api/auth/refresh/route';
import { prisma } from '@/src/lib/db/prisma';
import { generateToken } from '@/src/lib/auth/jwt';

// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    headers = new Map();
    json = jest.fn();
    
    constructor(url: string, init?: RequestInit) {
      this.headers.set('authorization', 'Bearer test-token');
    }
  },
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}));

// Mock Prisma
jest.mock('@/src/lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock auth middleware
jest.mock('@/src/lib/auth/middleware', () => ({
  authenticate: jest.fn(),
}));

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should refresh token successfully', async () => {
    const { authenticate } = await import('@/src/lib/auth/middleware');
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'learner',
      organizationId: 'org-123',
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBeDefined();
    expect(data.expiresAt).toBeDefined();
  });

  it('should return 401 for invalid token', async () => {
    const { authenticate } = await import('@/src/lib/auth/middleware');
    (authenticate as jest.Mock).mockRejectedValue(new Error('Invalid token'));

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/refresh', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid token');
  });
});

