import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/src/lib/db/prisma';
import { hashPassword } from '@/src/lib/auth/password';

// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    headers = new Map();
    json = jest.fn();
    
    constructor(url: string, init?: RequestInit) {
      if (init?.body) {
        this.json = jest.fn().mockResolvedValue(JSON.parse(init.body as string));
      }
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

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login successfully with valid credentials', async () => {
    const passwordHash = await hashPassword('password123');
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'learner',
      organizationId: 'org-123',
      passwordHash,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const { NextRequest } = await import('next/server');
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
    expect(data.expiresAt).toBeDefined();
  });

  it('should return 401 for invalid email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 401 for invalid password', async () => {
    const passwordHash = await hashPassword('correct-password');
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      passwordHash,
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong-password',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return 400 for invalid email format', async () => {
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
  });
});

