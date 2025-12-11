import { Worker } from 'bullmq';
import { ContentProcessor } from '../services/content-ingestion/processor';
import { prisma } from '../lib/db/prisma';
import logger from '../lib/logger';

const processor = new ContentProcessor(prisma);

const worker = new Worker(
  'content-processing',
  async (job) => {
    logger.info('Processing job', {
      jobId: job.id,
      data: job.data,
    });

    const { jobId } = job.data as { jobId: string };
    await processor.processJob(jobId);

    logger.info('Completed job', { jobId: job.id });
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    concurrency: 5,
  }
);

worker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('Job failed', {
    jobId: job?.id,
    error: err.message,
  });
});

logger.info('Content processing worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down worker');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down worker');
  await worker.close();
  process.exit(0);
});

