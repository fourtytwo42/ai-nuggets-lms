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

import { PUT, DELETE } from '@/app/api/admin/ingestion/folders/[id]/route';
import { prisma } from '@/src/lib/db/prisma';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';

describe('PUT /api/admin/ingestion/folders/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a watched folder', async () => {
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
      fileTypes: ['pdf'],
      recursive: true,
      autoProcess: true,
    };
    const updatedFolder = { ...mockFolder, enabled: false };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.watchedFolder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
    (prisma.watchedFolder.update as jest.Mock).mockResolvedValue(updatedFolder);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders/folder-123', {
      method: 'PUT',
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PUT(request, { params: { id: 'folder-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.enabled).toBe(false);
  });

  it('should return 404 if folder not found', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.watchedFolder.findUnique as jest.Mock).mockResolvedValue(null);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders/folder-123', {
      method: 'PUT',
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PUT(request, { params: { id: 'folder-123' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Folder not found');
  });
});

describe('DELETE /api/admin/ingestion/folders/[id]', () => {
  it('should delete a watched folder', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'admin',
    };
    const mockFolder = {
      id: 'folder-123',
      organizationId: 'org-123',
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.watchedFolder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
    (prisma.watchedFolder.delete as jest.Mock).mockResolvedValue(mockFolder);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders/folder-123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: { id: 'folder-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

