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

jest.mock('chokidar', () => {
  const mockWatcher = {
    on: jest.fn().mockReturnThis(),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const mockWatch = jest.fn(() => mockWatcher);
  const chokidarMock = {
    watch: mockWatch,
  };
  return {
    __esModule: true,
    default: chokidarMock,
  };
});

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
import { processingQueue } from '@/src/services/jobs/queues';
import { promises as fs } from 'fs';
import logger from '@/src/lib/logger';
import chokidar from 'chokidar';

const mockCreate = prisma.ingestionJob.create as jest.Mock;
const mockAdd = processingQueue.add as jest.Mock;
const mockStat = fs.stat as jest.Mock;
const mockWatch = (chokidar as any).watch as jest.Mock;

describe('FileWatcherService Integration', () => {
  let service: FileWatcherService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FileWatcherService(prisma as any);
  });

  describe('startWatching', () => {
    it('should start watching a folder with correct configuration', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf', 'docx'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      expect(mockWatch).toHaveBeenCalledWith('/test/path', {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
        depth: undefined, // recursive
      });

      expect(logger.info).toHaveBeenCalledWith('Started watching folder', {
        folderId: 'folder-123',
        path: '/test/path',
      });
    });

    it('should configure non-recursive watching', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: false,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      expect(mockWatch).toHaveBeenCalledWith(
        '/test/path',
        expect.objectContaining({
          depth: 0, // non-recursive
        })
      );
    });

    it('should skip disabled folders', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: false,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      expect(mockWatch).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'Folder is disabled, skipping watch',
        { folderId: 'folder-123', path: '/test/path' }
      );
    });

    it('should register add event handler', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      const watcher = mockWatch.mock.results[0].value;
      const addCall = (watcher.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'add'
      );
      expect(addCall).toBeDefined();
      expect(addCall[1]).toBeInstanceOf(Function);
    });

    it('should register error event handler', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      const watcher = mockWatch.mock.results[0].value;
      const errorCall = (watcher.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'error'
      );
      expect(errorCall).toBeDefined();
      expect(errorCall[1]).toBeInstanceOf(Function);
    });

    it('should process valid file types when added', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf', 'docx'],
        recursive: true,
        autoProcess: true,
      };

      mockStat.mockResolvedValue({ size: 1024 });
      mockCreate.mockResolvedValue({ id: 'job-123' });
      mockAdd.mockResolvedValue(undefined);

      await service.startWatching('folder-123', folder);

      const watcher = mockWatch.mock.results[0].value;
      const addCall = (watcher.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'add'
      );
      const addHandler = addCall[1];

      await addHandler('/test/path/document.pdf');

      expect(mockStat).toHaveBeenCalledWith('/test/path/document.pdf');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'file',
            source: '/test/path/document.pdf',
            organizationId: 'org-123',
            status: 'pending',
            metadata: expect.objectContaining({
              folderId: 'folder-123',
              fileName: 'document.pdf',
              fileSize: 1024,
            }),
          }),
        })
      );
      expect(mockAdd).toHaveBeenCalledWith(
        'file',
        expect.objectContaining({
          jobId: 'job-123',
          type: 'file',
          source: '/test/path/document.pdf',
          organizationId: 'org-123',
        })
      );
    });

    it('should skip invalid file types', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      const watcher = mockWatch.mock.results[0].value;
      const addCall = (watcher.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'add'
      );
      const addHandler = addCall[1];

      await addHandler('/test/path/document.txt');

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should handle errors in add handler', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      mockStat.mockRejectedValue(new Error('File not found'));

      await service.startWatching('folder-123', folder);

      const watcher = mockWatch.mock.results[0].value;
      const addCall = (watcher.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'add'
      );
      const addHandler = addCall[1];

      await addHandler('/test/path/document.pdf');

      expect(logger.error).toHaveBeenCalledWith(
        'Error processing new file',
        expect.objectContaining({
          folderId: 'folder-123',
          filePath: '/test/path/document.pdf',
          error: 'File not found',
        })
      );
    });

    it('should handle watcher errors', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);

      const watcher = mockWatch.mock.results[0].value;
      const errorCall = (watcher.on as jest.Mock).mock.calls.find(
        (call: any[]) => call[0] === 'error'
      );
      const errorHandler = errorCall[1];

      errorHandler(new Error('Watcher error'));

      expect(logger.error).toHaveBeenCalledWith('File watcher error', {
        folderId: 'folder-123',
        error: 'Watcher error',
      });
    });
  });

  describe('stopWatching', () => {
    it('should stop watching a folder', async () => {
      const folder = {
        id: 'folder-123',
        organizationId: 'org-123',
        path: '/test/path',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-123', folder);
      await service.stopWatching('folder-123');

      const watcher = mockWatch.mock.results[0].value;
      expect(watcher.close as jest.Mock).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Stopped watching folder', {
        folderId: 'folder-123',
      });
    });

    it('should handle stopping non-existent watcher', async () => {
      await service.stopWatching('non-existent');

      // No watcher created for disabled folder
      expect(mockWatch).not.toHaveBeenCalled();
    });
  });

  describe('stopAll', () => {
    it('should stop all watchers', async () => {
      const folder1 = {
        id: 'folder-1',
        organizationId: 'org-123',
        path: '/test/path1',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      const folder2 = {
        id: 'folder-2',
        organizationId: 'org-123',
        path: '/test/path2',
        enabled: true,
        fileTypes: ['pdf'],
        recursive: true,
        autoProcess: true,
      };

      await service.startWatching('folder-1', folder1);
      await service.startWatching('folder-2', folder2);
      await service.stopAll();

      const watcher1 = mockWatch.mock.results[0].value;
      const watcher2 = mockWatch.mock.results[1].value;
      expect(watcher1.close as jest.Mock).toHaveBeenCalled();
      expect(watcher2.close as jest.Mock).toHaveBeenCalled();
    });
  });
});
