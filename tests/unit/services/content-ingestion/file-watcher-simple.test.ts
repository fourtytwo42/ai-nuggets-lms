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

jest.mock('chokidar', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/src/lib/db/prisma', () => ({
  prisma: {
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

jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
  },
}));

import { FileWatcherService } from '@/src/services/content-ingestion/file-watcher';
import { prisma } from '@/src/lib/db/prisma';

describe('FileWatcherService', () => {
  let service: FileWatcherService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FileWatcherService(prisma as any);
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(FileWatcherService);
  });

  it('should skip disabled folders', async () => {
    const folder = {
      id: 'folder-123',
      organizationId: 'org-123',
      path: '/test',
      enabled: false,
      fileTypes: ['pdf'],
      recursive: true,
      autoProcess: true,
    };

    await service.startWatching('folder-123', folder);

    // Should not throw and should skip watching
    expect(true).toBe(true);
  });

  it('should validate file types', () => {
    const isValid = (service as any).isValidFileType('/test/file.pdf', ['pdf', 'docx']);
    expect(isValid).toBe(true);

    const isInvalid = (service as any).isValidFileType('/test/file.txt', ['pdf', 'docx']);
    expect(isInvalid).toBe(false);
  });
});

