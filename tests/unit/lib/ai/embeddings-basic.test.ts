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
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  },
}));

const mockCreate = jest.fn();

jest.mock('openai', () => {
  const mockOpenAI = {
    embeddings: {
      create: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI),
  };
});

import { generateEmbedding, storeEmbedding, searchSimilar } from '@/src/lib/ai/embeddings';
import { prisma } from '@/src/lib/db/prisma';
import OpenAI from 'openai';

const mockExecuteRaw = prisma.$executeRaw as jest.Mock;
const mockQueryRaw = prisma.$queryRaw as jest.Mock;

describe('Embeddings Service - Basic Tests', () => {
  let openai: OpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    openai = new OpenAI({ apiKey: 'test-key' });
    mockCreate.mockClear();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding successfully', async () => {
      const mockEmbedding = new Array(1536).fill(0.5);
      (openai.embeddings.create as jest.Mock).mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(openai.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text',
      });
    });

    it('should truncate text to 8000 characters', async () => {
      const longText = 'a'.repeat(10000);
      const mockEmbedding = new Array(1536).fill(0.5);
      (openai.embeddings.create as jest.Mock).mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      await generateEmbedding(longText);

      expect(openai.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: longText.substring(0, 8000),
      });
    });

    it('should throw error on API failure', async () => {
      (openai.embeddings.create as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      await expect(generateEmbedding('test')).rejects.toThrow('API error');
    });
  });

  describe('storeEmbedding', () => {
    it('should store embedding successfully', async () => {
      const embedding = new Array(1536).fill(0.5);
      mockExecuteRaw.mockResolvedValue(undefined);

      await storeEmbedding('nugget-123', embedding);

      expect(mockExecuteRaw).toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      const embedding = new Array(1536).fill(0.5);
      mockExecuteRaw.mockRejectedValue(new Error('Database error'));

      await expect(storeEmbedding('nugget-123', embedding)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('searchSimilar', () => {
    it('should search for similar embeddings', async () => {
      const queryEmbedding = new Array(1536).fill(0.5);
      const mockResults = [
        { id: 'nugget-1', content: 'content 1', similarity: 0.95 },
        { id: 'nugget-2', content: 'content 2', similarity: 0.90 },
      ];
      mockQueryRaw.mockResolvedValue(mockResults);

      const results = await searchSimilar(queryEmbedding, 'org-123', 10);

      expect(results).toEqual(mockResults);
      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it('should use default limit of 10', async () => {
      const queryEmbedding = new Array(1536).fill(0.5);
      mockQueryRaw.mockResolvedValue([]);

      await searchSimilar(queryEmbedding, 'org-123');

      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it('should throw error on database failure', async () => {
      const queryEmbedding = new Array(1536).fill(0.5);
      mockQueryRaw.mockRejectedValue(new Error('Database error'));

      await expect(
        searchSimilar(queryEmbedding, 'org-123')
      ).rejects.toThrow('Database error');
    });
  });
});

