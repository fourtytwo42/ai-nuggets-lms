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
    watchedFolder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock file watcher
jest.mock('@/src/services/content-ingestion/file-watcher', () => ({
  FileWatcherService: jest.fn().mockImplementation(() => ({
    startWatching: jest.fn(),
    stopWatching: jest.fn(),
  })),
}));

import { POST, GET } from '@/app/api/admin/ingestion/folders/route';
import { prisma } from '@/src/lib/db/prisma';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';

describe('POST /api/admin/ingestion/folders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a watched folder', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockFolder = {
      id: 'folder-123',
      organizationId: 'org-123',
      path: '/test/path',
      enabled: true,
      fileTypes: ['pdf', 'docx'],
      recursive: true,
      autoProcess: true,
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.watchedFolder.create as jest.Mock).mockResolvedValue(mockFolder);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders', {
      method: 'POST',
      body: JSON.stringify({
        path: '/test/path',
        fileTypes: ['pdf', 'docx'],
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.path).toBe('/test/path');
  });

  it('should return folders for organization', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockFolders = [
      {
        id: 'folder-1',
        organizationId: 'org-123',
        path: '/path1',
      },
      {
        id: 'folder-2',
        organizationId: 'org-123',
        path: '/path2',
      },
    ];

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.watchedFolder.findMany as jest.Mock).mockResolvedValue(mockFolders);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
  });
});

