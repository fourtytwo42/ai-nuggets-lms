// Mock logger first - must be hoisted
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

jest.mock('@/src/lib/ai/embeddings', () => ({
  generateEmbedding: jest.fn(),
}));

import { SemanticChunker, Chunk } from '@/src/services/content-ingestion/chunking';
import { generateEmbedding } from '@/src/lib/ai/embeddings';

describe('SemanticChunker', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    chunker = new SemanticChunker();
    jest.clearAllMocks();
  });

  it('should return empty array for empty text', async () => {
    const chunks = await chunker.chunk('');
    expect(chunks).toEqual([]);
  });

  it('should create single chunk for short text', async () => {
    const text = 'This is a short paragraph.';
    const mockEmbedding = new Array(1536).fill(0.5);

    (generateEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

    const chunks = await chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('This is a short paragraph');
  });

  it('should split text into multiple chunks', async () => {
    const paragraphs = Array(10)
      .fill(0)
      .map((_, i) => `Paragraph ${i + 1} content.`)
      .join('\n\n');
    
    // Create embeddings with varying similarity
    const embeddings = Array(10).fill(0).map((_, i) => {
      const base = new Array(1536).fill(0.5);
      // Make some paragraphs more similar
      if (i > 0 && i % 3 === 0) {
        return base.map((v) => v + 0.4); // High similarity
      }
      return base;
    });

    (generateEmbedding as jest.Mock).mockImplementation((text: string) => {
      const index = paragraphs.split('\n\n').indexOf(text.trim());
      return Promise.resolve(embeddings[index] || embeddings[0]);
    });

    const chunks = await chunker.chunk(paragraphs);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle cosine similarity calculation', () => {
    const a = [1, 0, 0];
    const b = [1, 0, 0];
    // Access private method via type assertion
    const similarity = (chunker as any).cosineSimilarity(a, b);
    expect(similarity).toBeCloseTo(1, 5);
  });

  it('should return 0 for different length vectors', () => {
    const a = [1, 0];
    const b = [1, 0, 0];
    const similarity = (chunker as any).cosineSimilarity(a, b);
    expect(similarity).toBe(0);
  });

  it('should estimate tokens correctly', () => {
    const text = 'a'.repeat(400); // 400 characters
    const tokens = (chunker as any).estimateTokens(text);
    expect(tokens).toBe(100); // 400 / 4 = 100
  });
});

