import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import path from 'path';
import { promises as fs } from 'fs';
import { PrismaClient } from '@prisma/client';
import { processingQueue } from '../jobs/queues';
import logger from '@/src/lib/logger';

interface WatchedFolder {
  id: string;
  organizationId: string;
  path: string;
  enabled: boolean;
  fileTypes: string[];
  recursive: boolean;
  autoProcess: boolean;
}

export class FileWatcherService {
  private watchers: Map<string, FSWatcher> = new Map();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async startWatching(folderId: string, folder: WatchedFolder): Promise<void> {
    if (!folder.enabled) {
      logger.info('Folder is disabled, skipping watch', { folderId, path: folder.path });
      return;
    }

    const watcher = chokidar.watch(folder.path, {
      ignored: /(^|[\/\\])\../, // Ignore dotfiles
      persistent: true,
      ignoreInitial: true, // Don't process existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 2000, // Wait 2s after file stops changing
        pollInterval: 100, // Check every 100ms
      },
      depth: folder.recursive ? undefined : 0, // Recursive or not
    });

    watcher.on('add', async (filePath) => {
      try {
        if (this.isValidFileType(filePath, folder.fileTypes)) {
          await this.queueFileProcessing(filePath, folder);
        }
      } catch (error) {
        logger.error('Error processing new file', {
          folderId,
          filePath,
          error: (error as Error).message,
        });
      }
    });

    watcher.on('error', (error) => {
      logger.error('File watcher error', { folderId, error: (error as Error).message });
    });

    this.watchers.set(folderId, watcher);
    logger.info('Started watching folder', { folderId, path: folder.path });
  }

  async stopWatching(folderId: string): Promise<void> {
    const watcher = this.watchers.get(folderId);
    if (watcher) {
      await watcher.close();
      this.watchers.delete(folderId);
      logger.info('Stopped watching folder', { folderId });
    }
  }

  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.watchers.keys()).map((id) =>
      this.stopWatching(id)
    );
    await Promise.all(stopPromises);
  }

  private isValidFileType(filePath: string, allowedTypes: string[]): boolean {
    const ext = path.extname(filePath).toLowerCase().slice(1);
    return allowedTypes.includes(ext);
  }

  private async queueFileProcessing(
    filePath: string,
    folder: WatchedFolder
  ): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const fileName = path.basename(filePath);

      // Create ingestion job record
      const job = await this.prisma.ingestionJob.create({
        data: {
          type: 'file',
          source: filePath,
          organizationId: folder.organizationId,
          status: 'pending',
          metadata: {
            folderId: folder.id,
            fileName,
            fileSize: stats.size,
          },
        },
      });

      // Queue for processing
      await processingQueue.add('file', {
        jobId: job.id,
        type: 'file',
        source: filePath,
        organizationId: folder.organizationId,
        metadata: {
          folderId: folder.id,
          fileName,
        },
      });

      logger.info('Queued file for processing', { jobId: job.id, filePath });
    } catch (error) {
      logger.error('Failed to queue file processing', {
        filePath,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

