// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    headers = new Map();
    json = jest.fn();

    constructor(url: string, init?: RequestInit) {
      this.headers.set('authorization', 'Bearer test-token');
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

// Mock auth
jest.mock('@/src/lib/auth/middleware', () => ({
  authenticate: jest.fn(),
  requireRole: jest.fn(),
}));

// Mock Prisma
jest.mock('@/src/lib/db/prisma', () => ({
  prisma: {
    monitoredURL: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { POST, GET } from '@/app/api/admin/ingestion/urls/route';
import { prisma } from '@/src/lib/db/prisma';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';

describe('POST /api/admin/ingestion/urls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a monitored URL', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockUrl = {
      id: 'url-123',
      organizationId: 'org-123',
      url: 'https://example.com',
      enabled: true,
      checkInterval: 5,
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.monitoredURL.create as jest.Mock).mockResolvedValue(mockUrl);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/urls', {
      method: 'POST',
      body: JSON.stringify({
        url: 'https://example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.url).toBe('https://example.com');
  });
});

describe('GET /api/admin/ingestion/urls', () => {
  it('should return URLs for organization', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockUrls = [
      { id: 'url-1', url: 'https://example.com' },
      { id: 'url-2', url: 'https://test.com' },
    ];

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.monitoredURL.findMany as jest.Mock).mockResolvedValue(mockUrls);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/urls', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

