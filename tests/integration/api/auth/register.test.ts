import { POST } from '@/app/api/auth/register/route';
import { prisma } from '@/src/lib/db/prisma';

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
      create: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
    learner: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register a new user successfully', async () => {
    const mockOrg = { id: 'org-123', name: "Test User's Organization" };
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'learner',
      organizationId: 'org-123',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.organization.create as jest.Mock).mockResolvedValue(mockOrg);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    (prisma.learner.create as jest.Mock).mockResolvedValue({});

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.token).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
    expect(data.user.name).toBe('Test User');
    expect(data.expiresAt).toBeDefined();
  });

  it('should return 409 if email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    });

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Email already exists');
  });

  it('should return 400 for invalid email', async () => {
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
    expect(data.fields).toBeDefined();
  });

  it('should return 400 for short password', async () => {
    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'short',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Validation error');
  });

  it('should create organization with provided name', async () => {
    const mockOrg = { id: 'org-123', name: 'Custom Organization' };
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'learner',
      organizationId: 'org-123',
    };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.organization.create as jest.Mock).mockResolvedValue(mockOrg);
    (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
    (prisma.learner.create as jest.Mock).mockResolvedValue({});

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        organizationName: 'Custom Organization',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(prisma.organization.create).toHaveBeenCalledWith({
      data: { name: 'Custom Organization' },
    });
    expect(data.user.organizationId).toBe('org-123');
  });

  it('should handle internal server errors', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

