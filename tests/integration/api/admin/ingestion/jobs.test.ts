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

describe('GET /api/admin/ingestion/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return jobs for organization', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockJobs = [
      { id: 'job-1', status: 'completed', type: 'file' },
      { id: 'job-2', status: 'processing', type: 'url' },
    ];

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.ingestionJob.findMany as jest.Mock).mockResolvedValue(mockJobs);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest(new URL('http://localhost/api/admin/ingestion/jobs'), {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
  });

  it('should filter by status if provided', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockJobs = [{ id: 'job-1', status: 'completed' }];

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.ingestionJob.findMany as jest.Mock).mockResolvedValue(mockJobs);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/jobs?status=completed', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(prisma.ingestionJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'completed' }),
      })
    );
  });
});

