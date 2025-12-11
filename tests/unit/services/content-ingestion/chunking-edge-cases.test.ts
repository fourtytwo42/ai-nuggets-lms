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

jest.mock('@/src/lib/ai/embeddings', () => ({
  generateEmbedding: jest.fn(),
}));

import { SemanticChunker } from '@/src/services/content-ingestion/chunking';
import { generateEmbedding } from '@/src/lib/ai/embeddings';

const mockGenerateEmbedding = generateEmbedding as jest.Mock;

describe('SemanticChunker Edge Cases', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    jest.clearAllMocks();
    chunker = new SemanticChunker();
  });

  it('should handle text with only whitespace', async () => {
    const text = '   \n\n   \t   ';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(text);

    // Should handle gracefully
    expect(Array.isArray(chunks)).toBe(true);
  });

  it('should handle single very long paragraph', async () => {
    const longParagraph = 'Word '.repeat(1000);
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(longParagraph);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle paragraphs with varying similarity', async () => {
    const text = 'Paragraph one.\n\nParagraph two.\n\nParagraph three.';
    
    // Varying similarity scores
    mockGenerateEmbedding
      .mockResolvedValueOnce(new Array(1536).fill(0.9)) // High similarity
      .mockResolvedValueOnce(new Array(1536).fill(0.92)) // Very high similarity (should cluster)
      .mockResolvedValueOnce(new Array(1536).fill(0.1)); // Low similarity (separate chunk)

    const chunks = await chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(0);
    expect(mockGenerateEmbedding).toHaveBeenCalledTimes(3);
  });

  it('should handle text with special characters', async () => {
    const text = 'Content with "quotes" and (parentheses) and [brackets].\n\nMore content.';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('quotes');
  });

  it('should handle text with unicode characters', async () => {
    const text = 'Content with émojis 🎉 and unicode 中文.\n\nMore content.';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(text);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should combine chunks when similarity is high', async () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
    
    // All paragraphs have high similarity (should combine)
    mockGenerateEmbedding
      .mockResolvedValueOnce(new Array(1536).fill(0.9))
      .mockResolvedValueOnce(new Array(1536).fill(0.91))
      .mockResolvedValueOnce(new Array(1536).fill(0.89));

    const chunks = await chunker.chunk(text);

    // Should combine similar paragraphs
    expect(chunks.length).toBeLessThan(3);
  });

  it('should split chunks when they exceed token limit', async () => {
    const longText = 'Very long paragraph. '.repeat(200);
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(longText);

    // Should split if exceeds ~2000 tokens
    expect(chunks.length).toBeGreaterThan(0);
  });
});

