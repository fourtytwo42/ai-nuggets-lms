import { PrismaClient } from '@prisma/client';
import { processingQueue } from '../jobs/queues';
import logger from '@/src/lib/logger';

interface MonitoredURL {
  id: string;
  organizationId: string;
  url: string;
  enabled: boolean;
  checkInterval: number;
  lastChecked: Date | null;
  lastModified: Date | null;
  etag: string | null;
}

export class URLMonitoringService {
  private prisma: PrismaClient;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async checkURLs(): Promise<void> {
    const urls = await this.prisma.monitoredURL.findMany({
      where: { enabled: true },
    });

    logger.info('Checking monitored URLs', { count: urls.length });

    for (const url of urls) {
      try {
        // Check if URL has changed
        const hasChanged = await this.checkURLChange(url);

        if (hasChanged) {
          await this.queueURLProcessing(url);
          await this.updateURLMetadata(url);
        } else {
          // Update last checked even if no change
          await this.prisma.monitoredURL.update({
            where: { id: url.id },
            data: { lastChecked: new Date() },
          });
        }
      } catch (error) {
        logger.error('URL check failed', {
          urlId: url.id,
          url: url.url,
          error: (error as Error).message,
        });
        // Continue with other URLs
      }
    }
  }

  private async checkURLChange(url: MonitoredURL): Promise<boolean> {
    try {
      const response = await fetch(url.url, {
        method: 'HEAD',
        headers: {
          'If-None-Match': url.etag || '',
          'If-Modified-Since':
            url.lastModified?.toUTCString() || '',
          'User-Agent': 'AI-Microlearning-LMS/1.0',
        },
      });

      if (response.status === 304) {
        // Not modified
        return false;
      }

      if (response.status === 200) {
        const newEtag = response.headers.get('ETag');
        const newModified = response.headers.get('Last-Modified');

        // Check if content changed
        if (
          newEtag !== url.etag ||
          (newModified &&
            new Date(newModified) >
              (url.lastModified || new Date(0)))
        ) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Failed to check URL', {
        url: url.url,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async queueURLProcessing(url: MonitoredURL): Promise<void> {
    try {
      // Create ingestion job record
      const job = await this.prisma.ingestionJob.create({
        data: {
          type: 'url',
          source: url.url,
          organizationId: url.organizationId,
          status: 'pending',
          metadata: {
            urlId: url.id,
          },
        },
      });

      // Queue for processing
      await processingQueue.add('url', {
        jobId: job.id,
        type: 'url',
        source: url.url,
        organizationId: url.organizationId,
        metadata: {
          urlId: url.id,
        },
      });

      logger.info('Queued URL for processing', {
        jobId: job.id,
        url: url.url,
      });
    } catch (error) {
      logger.error('Failed to queue URL processing', {
        url: url.url,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async updateURLMetadata(url: MonitoredURL): Promise<void> {
    try {
      const response = await fetch(url.url, { method: 'HEAD' });
      const etag = response.headers.get('ETag');
      const lastModified = response.headers.get('Last-Modified');

      await this.prisma.monitoredURL.update({
        where: { id: url.id },
        data: {
          lastChecked: new Date(),
          etag: etag || undefined,
          lastModified: lastModified
            ? new Date(lastModified)
            : undefined,
        },
      });
    } catch (error) {
      logger.error('Failed to update URL metadata', {
        url: url.url,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  start(intervalMinutes: number = 5): void {
    // Run immediately
    this.checkURLs().catch((error) => {
      logger.error('Error in initial URL check', {
        error: (error as Error).message,
      });
    });

    // Then run at interval
    this.checkInterval = setInterval(
      () => {
        this.checkURLs().catch((error) => {
          logger.error('Error in periodic URL check', {
            error: (error as Error).message,
          });
        });
      },
      intervalMinutes * 60 * 1000
    );

    logger.info('URL monitoring started', { intervalMinutes });
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info('URL monitoring stopped');
    }
  }
}

