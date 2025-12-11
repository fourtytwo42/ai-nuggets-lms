import { PrismaClient, Prisma } from '@prisma/client';
import { TextExtractor } from './extraction';
import { SemanticChunker } from './chunking';
import { generateEmbedding, storeEmbedding } from '@/src/lib/ai/embeddings';
import { extractMetadata } from './metadata';
import { generateImage } from './images';
import logger from '@/src/lib/logger';

export class ContentProcessor {
  private prisma: PrismaClient;
  private textExtractor: TextExtractor;
  private chunker: SemanticChunker;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.textExtractor = new TextExtractor();
    this.chunker = new SemanticChunker();
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.prisma.ingestionJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status !== 'pending') {
      logger.warn('Job is not pending', { jobId, status: job.status });
      return;
    }

    // Update job status
    await this.prisma.ingestionJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    });

    try {
      logger.info('Processing content', {
        jobId,
        type: job.type,
        source: job.source,
      });

      // 1. Extract text
      const text = await this.textExtractor.extract(
        job.source,
        job.type as 'file' | 'url'
      );

      if (!text || text.trim().length === 0) {
        throw new Error('No text extracted from source');
      }

      // 2. Semantic chunking
      const chunks = await this.chunker.chunk(text);

      if (chunks.length === 0) {
        throw new Error('No chunks created from text');
      }

      logger.info('Created chunks', {
        jobId,
        chunkCount: chunks.length,
      });

      // 3. Process each chunk into a nugget
      const nuggetIds: string[] = [];

      for (const chunk of chunks) {
        try {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.text);

          // Extract metadata
          const metadata = await extractMetadata(chunk.text);

          // Create nugget
          const nugget = await this.prisma.nugget.create({
            data: {
              organizationId: job.organizationId,
              content: chunk.text,
              metadata: metadata as unknown as Prisma.InputJsonValue,
              status: 'ready',
            },
          });

          // Store embedding
          await storeEmbedding(nugget.id, embedding);

          // Generate image (async, don't wait)
          generateImage(chunk.text, nugget.id)
            .then((imageUrl) => {
              if (imageUrl) {
                return this.prisma.nugget.update({
                  where: { id: nugget.id },
                  data: { imageUrl },
                });
              }
            })
            .catch((error) => {
              logger.error('Failed to generate image', {
                nuggetId: nugget.id,
                error: (error as Error).message,
              });
            });

          // Create nugget source link
          await this.prisma.nuggetSource.create({
            data: {
              nuggetId: nugget.id,
              sourceType: job.type,
              sourcePath: job.source,
              ingestionJobId: job.id,
            },
          });

          nuggetIds.push(nugget.id);
        } catch (error) {
          logger.error('Failed to process chunk', {
            jobId,
            error: (error as Error).message,
          });
          // Continue with other chunks
        }
      }

      // Update job status
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          nuggetCount: nuggetIds.length,
        },
      });

      logger.info('Completed processing job', {
        jobId,
        nuggetCount: nuggetIds.length,
      });
    } catch (error) {
      // Update job status to failed
      await this.prisma.ingestionJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: (error as Error).message,
        },
      });

      logger.error('Job processing failed', {
        jobId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

