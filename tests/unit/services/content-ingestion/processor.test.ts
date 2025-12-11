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

jest.mock('@/src/services/content-ingestion/extraction', () => ({
  TextExtractor: jest.fn().mockImplementation(() => ({
    extract: jest.fn(),
  })),
}));

jest.mock('@/src/services/content-ingestion/chunking', () => ({
  SemanticChunker: jest.fn().mockImplementation(() => ({
    chunk: jest.fn(),
  })),
}));

jest.mock('@/src/lib/ai/embeddings', () => ({
  generateEmbedding: jest.fn(),
  storeEmbedding: jest.fn(),
}));

jest.mock('@/src/services/content-ingestion/metadata', () => ({
  extractMetadata: jest.fn(),
}));

jest.mock('@/src/services/content-ingestion/images', () => ({
  generateImage: jest.fn(),
}));

jest.mock('@/src/lib/db/prisma', () => ({
  prisma: {
    ingestionJob: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    nugget: {
      create: jest.fn(),
      update: jest.fn(),
    },
    nuggetSource: {
      create: jest.fn(),
    },
  },
}));

import { ContentProcessor } from '@/src/services/content-ingestion/processor';
import { prisma } from '@/src/lib/db/prisma';
import { TextExtractor } from '@/src/services/content-ingestion/extraction';
import { SemanticChunker } from '@/src/services/content-ingestion/chunking';
import { generateEmbedding, storeEmbedding } from '@/src/lib/ai/embeddings';
import { extractMetadata } from '@/src/services/content-ingestion/metadata';

describe('ContentProcessor', () => {
  let processor: ContentProcessor;
  let mockTextExtractor: jest.Mocked<TextExtractor>;
  let mockChunker: jest.Mocked<SemanticChunker>;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new ContentProcessor(prisma as any);
    mockTextExtractor = (processor as any).textExtractor;
    mockChunker = (processor as any).chunker;
  });

  it('should process a file job successfully', async () => {
    const mockJob = {
      id: 'job-123',
      type: 'file',
      source: '/path/to/file.pdf',
      organizationId: 'org-123',
      status: 'pending',
    };

    const mockText = 'This is test content for processing.';
    const mockChunks = [
      {
        text: 'This is test content for processing.',
        paragraphIndices: [0],
        startIndex: 0,
        endIndex: 0,
      },
    ];
    const mockEmbedding = new Array(1536).fill(0.5);
    const mockMetadata = {
      topics: ['Test'],
      difficulty: 5,
      prerequisites: [],
      estimatedTime: 5,
      relatedConcepts: [],
    };
    const mockNugget = {
      id: 'nugget-123',
      organizationId: 'org-123',
      content: mockText,
      metadata: mockMetadata,
      status: 'ready',
    };

    (prisma.ingestionJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
    (prisma.ingestionJob.update as jest.Mock).mockResolvedValue(mockJob);
    (mockTextExtractor.extract as jest.Mock).mockResolvedValue(mockText);
    (mockChunker.chunk as jest.Mock).mockResolvedValue(mockChunks);
    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (extractMetadata as jest.Mock).mockResolvedValue(mockMetadata);
    (prisma.nugget.create as jest.Mock).mockResolvedValue(mockNugget);
    (storeEmbedding as jest.Mock).mockResolvedValue(undefined);
    (prisma.nuggetSource.create as jest.Mock).mockResolvedValue({});

    await processor.processJob('job-123');

    expect(mockTextExtractor.extract).toHaveBeenCalledWith(
      '/path/to/file.pdf',
      'file'
    );
    expect(mockChunker.chunk).toHaveBeenCalledWith(mockText);
    expect(prisma.nugget.create).toHaveBeenCalled();
  });

  it('should handle processing errors', async () => {
    const mockJob = {
      id: 'job-123',
      type: 'file',
      source: '/path/to/file.pdf',
      organizationId: 'org-123',
      status: 'pending',
    };

    (prisma.ingestionJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
    (prisma.ingestionJob.update as jest.Mock).mockResolvedValue(mockJob);
    (mockTextExtractor.extract as jest.Mock).mockRejectedValue(
      new Error('Extraction failed')
    );

    await expect(processor.processJob('job-123')).rejects.toThrow();

    expect(prisma.ingestionJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'job-123' },
        data: expect.objectContaining({ status: 'failed' }),
      })
    );
  });

  it('should skip processing if job is not pending', async () => {
    const mockJob = {
      id: 'job-123',
      status: 'processing',
    };

    (prisma.ingestionJob.findUnique as jest.Mock).mockResolvedValue(mockJob);

    await processor.processJob('job-123');

    expect(mockTextExtractor.extract).not.toHaveBeenCalled();
  });
});

