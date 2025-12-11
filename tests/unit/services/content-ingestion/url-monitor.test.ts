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
import { processingQueue } from '@/src/services/jobs/queues';

describe('URLMonitoringService', () => {
  let service: URLMonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new URLMonitoringService(prisma as any);
  });

  it('should check URLs and queue changed ones', async () => {
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

    (prisma.monitoredURL.findMany as jest.Mock).mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      headers: {
        get: jest.fn((name) => {
          if (name === 'ETag') return 'new-etag';
          if (name === 'Last-Modified') return 'Wed, 21 Oct 2024 07:28:00 GMT';
          return null;
        }),
      },
    });
    (prisma.ingestionJob.create as jest.Mock).mockResolvedValue({
      id: 'job-123',
    });
    (prisma.monitoredURL.update as jest.Mock).mockResolvedValue({});

    await service.checkURLs();

    expect(prisma.monitoredURL.findMany).toHaveBeenCalled();
    expect(processingQueue.add).toHaveBeenCalled();
  });

  it('should skip URLs that have not changed', async () => {
    const mockUrls = [
      {
        id: 'url-1',
        organizationId: 'org-123',
        url: 'https://example.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: null,
        etag: 'existing-etag',
      },
    ];

    (prisma.monitoredURL.findMany as jest.Mock).mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 304, // Not modified
    });
    (prisma.monitoredURL.update as jest.Mock).mockResolvedValue({});

    await service.checkURLs();

    expect(processingQueue.add).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
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

    (prisma.monitoredURL.findMany as jest.Mock).mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Should not throw
    await expect(service.checkURLs()).resolves.not.toThrow();
  });
});

