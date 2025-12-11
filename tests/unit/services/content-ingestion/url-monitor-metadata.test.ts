// Mock logger first
jest.mock('@/src/lib/logger', () => {
  return {
    __esModule: true,
    default: {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  };
});

jest.mock('@/src/lib/db/prisma', () => ({
  prisma: {
    monitoredURL: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    ingestionJob: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/src/services/jobs/queues', () => ({
  processingQueue: {
    add: jest.fn(),
  },
}));

global.fetch = jest.fn();

import { URLMonitoringService } from '@/src/services/content-ingestion/url-monitor';
import { prisma } from '@/src/lib/db/prisma';

const mockFindMany = prisma.monitoredURL.findMany as jest.Mock;
const mockUpdate = prisma.monitoredURL.update as jest.Mock;
const mockCreate = prisma.ingestionJob.create as jest.Mock;

describe('URLMonitoringService Metadata Updates', () => {
  let service: URLMonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new URLMonitoringService(prisma as any);
  });

  it('should update URL metadata with ETag and Last-Modified', async () => {
    const mockUrls = [
      {
        id: 'url-1',
        organizationId: 'org-123',
        url: 'https://example.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: null,
        etag: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn((name) => {
            if (name === 'ETag') return '"new-etag"';
            if (name === 'Last-Modified') return 'Wed, 21 Oct 2024 07:28:00 GMT';
            return null;
          }),
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn((name) => {
            if (name === 'ETag') return '"new-etag"';
            if (name === 'Last-Modified') return 'Wed, 21 Oct 2024 07:28:00 GMT';
            return null;
          }),
        },
      });
    mockCreate.mockResolvedValue({ id: 'job-123' });
    mockUpdate.mockResolvedValue({});

    await service.checkURLs();

    // Should update metadata
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'url-1' },
        data: expect.objectContaining({
          etag: '"new-etag"',
          lastModified: expect.any(Date),
        }),
      })
    );
  });

  it('should handle missing ETag gracefully', async () => {
    const mockUrls = [
      {
        id: 'url-1',
        organizationId: 'org-123',
        url: 'https://example.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: null,
        etag: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn((name) => {
            if (name === 'Last-Modified') return 'Wed, 21 Oct 2024 07:28:00 GMT';
            return null;
          }),
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn((name) => {
            if (name === 'Last-Modified') return 'Wed, 21 Oct 2024 07:28:00 GMT';
            return null;
          }),
        },
      });
    mockCreate.mockResolvedValue({ id: 'job-123' });
    mockUpdate.mockResolvedValue({});

    await service.checkURLs();

    // Should update with Last-Modified even without ETag
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle metadata update errors gracefully', async () => {
    const mockUrls = [
      {
        id: 'url-1',
        organizationId: 'org-123',
        url: 'https://example.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: null,
        etag: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn((name) => {
            if (name === 'ETag') return '"new-etag"';
            return null;
          }),
        },
      })
      .mockRejectedValueOnce(new Error('Network error'));

    mockCreate.mockResolvedValue({ id: 'job-123' });
    // First update succeeds (for queueURLProcessing), second fails (for updateURLMetadata)
    mockUpdate
      .mockResolvedValueOnce({}) // For queueURLProcessing update
      .mockRejectedValueOnce(new Error('Database error')); // For updateURLMetadata

    // Should handle error gracefully
    await expect(service.checkURLs()).resolves.not.toThrow();
  });
});

