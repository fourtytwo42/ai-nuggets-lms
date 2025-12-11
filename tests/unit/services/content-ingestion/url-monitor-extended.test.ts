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

const mockAdd = processingQueue.add as jest.Mock;
const mockCreate = prisma.ingestionJob.create as jest.Mock;
const mockUpdate = prisma.monitoredURL.update as jest.Mock;
const mockFindMany = prisma.monitoredURL.findMany as jest.Mock;

describe('URLMonitoringService Extended', () => {
  let service: URLMonitoringService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    service = new URLMonitoringService(prisma as any);
  });

  afterEach(() => {
    jest.useRealTimers();
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

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
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

    expect(prisma.monitoredURL.findMany).toHaveBeenCalledWith({
      where: { enabled: true },
    });
    expect(mockCreate).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
  });

  it('should skip URLs that have not changed (304)', async () => {
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

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 304, // Not modified
      headers: {
        get: jest.fn(),
      },
    });
    mockUpdate.mockResolvedValue({});

    await service.checkURLs();

    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'url-1' },
      data: { lastChecked: expect.any(Date) },
    });
  });

  it('should detect change via ETag', async () => {
    const mockUrls = [
      {
        id: 'url-1',
        organizationId: 'org-123',
        url: 'https://example.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: null,
        etag: 'old-etag',
      },
    ];

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      headers: {
        get: jest.fn((name) => {
          if (name === 'ETag') return '"new-etag"';
          return null;
        }),
      },
    });
    mockCreate.mockResolvedValue({ id: 'job-123' });
    mockUpdate.mockResolvedValue({});

    await service.checkURLs();

    expect(mockCreate).toHaveBeenCalled();
  });

  it('should detect change via Last-Modified', async () => {
    const oldDate = new Date('2024-01-01');
    const mockUrls = [
      {
        id: 'url-1',
        organizationId: 'org-123',
        url: 'https://example.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: oldDate,
        etag: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
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

    expect(mockCreate).toHaveBeenCalled();
  });

  it('should handle URL check errors gracefully', async () => {
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
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Should not throw
    await expect(service.checkURLs()).resolves.not.toThrow();
  });

  it('should start monitoring with interval', () => {
    service.start(5);

    expect(prisma.monitoredURL.findMany).toHaveBeenCalled();

    // Fast-forward time
    jest.advanceTimersByTime(5 * 60 * 1000);

    // Should have been called again
    expect((prisma.monitoredURL.findMany as jest.Mock).mock.calls.length).toBeGreaterThan(1);
  });

  it('should stop monitoring', () => {
    service.start(5);
    service.stop();

    const callCount = mockFindMany.mock.calls.length;

    // Fast-forward time
    jest.advanceTimersByTime(5 * 60 * 1000);

    // Should not have been called again
    expect((prisma.monitoredURL.findMany as jest.Mock).mock.calls.length).toBe(callCount);
  });

  it('should handle multiple URLs', async () => {
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
      {
        id: 'url-2',
        organizationId: 'org-123',
        url: 'https://test.com',
        enabled: true,
        checkInterval: 5,
        lastChecked: null,
        lastModified: null,
        etag: null,
      },
    ];

    mockFindMany.mockResolvedValue(mockUrls);
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      headers: {
        get: jest.fn((name) => {
          if (name === 'ETag') return '"new-etag"';
          return null;
        }),
      },
    });
    mockCreate.mockResolvedValue({ id: 'job-123' });
    mockUpdate.mockResolvedValue({});

    await service.checkURLs();

    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

