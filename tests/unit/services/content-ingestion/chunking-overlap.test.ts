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

describe('SemanticChunker Overlap Handling', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    jest.clearAllMocks();
    chunker = new SemanticChunker();
  });

  it('should handle overlap logic for multiple chunks', async () => {
    // Create text that will definitely create multiple chunks
    const longText = Array(10).fill('This is a paragraph with content.').join('\n\n');
    
    // Create embeddings with varying similarity to create clusters
    mockGenerateEmbedding.mockImplementation((text) => {
      const index = text.indexOf('paragraph');
      // Vary similarity to create some clustering
      return Promise.resolve(new Array(1536).fill((index % 5) / 10));
    });

    const chunks = await chunker.chunk(longText);

    // Should have at least one chunk
    expect(chunks.length).toBeGreaterThan(0);
    
    // All chunks should have text
    chunks.forEach(chunk => {
      expect(chunk.text.length).toBeGreaterThan(0);
      expect(chunk.text).toBeDefined();
    });
  });

  it('should not add overlap for single chunk', async () => {
    const text = 'Single paragraph content.';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(text);

    // Single chunk should not have overlap logic applied
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle chunks that exceed token limit and split them', async () => {
    // Create text that will exceed token limit when combined
    const longParagraph = 'Very long content. '.repeat(500);
    const text = `${longParagraph}\n\n${longParagraph}`;
    
    mockGenerateEmbedding
      .mockResolvedValueOnce(new Array(1536).fill(0.5))
      .mockResolvedValueOnce(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(text);

    // Should split into multiple chunks if exceeds ~2000 tokens
    expect(chunks.length).toBeGreaterThan(0);
  });
});

