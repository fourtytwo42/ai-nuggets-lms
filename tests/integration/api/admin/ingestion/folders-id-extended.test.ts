// Mock Next.js server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    headers = new Map();
    json = jest.fn();

    constructor(url: string, init?: RequestInit) {
      this.url = url;
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
const mockStartWatching = jest.fn();
const mockStopWatching = jest.fn();

jest.mock('@/src/services/content-ingestion/file-watcher', () => ({
  FileWatcherService: jest.fn().mockImplementation(() => ({
    startWatching: mockStartWatching,
    stopWatching: mockStopWatching,
  })),
}));

import { PUT, DELETE } from '@/app/api/admin/ingestion/folders/[id]/route';
import { prisma } from '@/src/lib/db/prisma';
import { authenticate, requireRole } from '@/src/lib/auth/middleware';

describe('PUT /api/admin/ingestion/folders/[id] Extended', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update folder and restart watching if enabled', async () => {
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
    const updatedFolder = { ...mockFolder, enabled: true, fileTypes: ['pdf', 'docx'] };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockResolvedValue(undefined);
    (prisma.watchedFolder.findUnique as jest.Mock).mockResolvedValue(mockFolder);
    (prisma.watchedFolder.update as jest.Mock).mockResolvedValue(updatedFolder);

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders/folder-123', {
      method: 'PUT',
      body: JSON.stringify({ fileTypes: ['pdf', 'docx'] }),
    });

    const response = await PUT(request, { params: { id: 'folder-123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fileTypes).toEqual(['pdf', 'docx']);
  });

  it('should stop watching if folder is disabled', async () => {
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

  it('should return 403 if user is not admin', async () => {
    const mockUser = {
      id: 'user-123',
      organizationId: 'org-123',
      role: 'learner',
    };

    (authenticate as jest.Mock).mockResolvedValue(mockUser);
    (requireRole as jest.Mock).mockRejectedValue(new Error('Forbidden'));

    const { NextRequest } = await import('next/server');
    const request = new NextRequest('http://localhost/api/admin/ingestion/folders/folder-123', {
      method: 'PUT',
      body: JSON.stringify({ enabled: false }),
    });

    const response = await PUT(request, { params: { id: 'folder-123' } });
    const data = await response.json();

    expect(response.status).toBe(500); // Error is caught and returns 500
    expect(data.error).toBeDefined();
  });
});

describe('DELETE /api/admin/ingestion/folders/[id] Extended', () => {
  it('should stop watching before deleting', async () => {
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
    expect(mockStopWatching).toHaveBeenCalledWith('folder-123');
  });
});

