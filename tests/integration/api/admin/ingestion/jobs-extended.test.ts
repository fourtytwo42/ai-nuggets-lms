// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    headers = new Map();
    json = jest.fn();
    url: string;
    nextUrl: { searchParams: URLSearchParams };

    constructor(url: string) {
      this.url = url;
      this.headers.set('authorization', 'Bearer test-token');
      const urlObj = new URL(url);
      this.nextUrl = { searchParams: urlObj.searchParams };
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
    ingestionJob: {
      findMany: jest.fn(),
    },
  },
}));

import { GET } from '@/app/api/admin/ingestion/jobs/route';
import { prisma } from '@/src/lib/db/prisma';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';

describe('GET /api/admin/ingestion/jobs Extended', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle limit parameter', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockJobs = Array(10).fill(null).map((_, i) => ({
      id: `job-${i}`,
      status: 'completed',
      type: 'file',
    }));

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.ingestionJob.findMany as jest.Mock).mockResolvedValue(mockJobs);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/jobs?limit=10', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(prisma.ingestionJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
      })
    );
  });

  it('should handle authentication errors', async () => {
    (authenticate as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/jobs', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('should return empty array when no jobs found', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.ingestionJob.findMany as jest.Mock).mockResolvedValue([]);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/jobs', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
});

