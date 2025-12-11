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

describe('SemanticChunker Extended', () => {
  let chunker: SemanticChunker;

  beforeEach(() => {
    jest.clearAllMocks();
    chunker = new SemanticChunker();
  });

  it('should handle very short text', async () => {
    const shortText = 'Short text.';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(shortText);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].text).toContain('Short text');
  });

  it('should handle text with many paragraphs', async () => {
    const longText = Array(50)
      .fill('This is a paragraph with some content.')
      .join('\n\n');
    
    // Mock embeddings with varying similarity
    mockGenerateEmbedding.mockImplementation((text) => {
      const index = text.indexOf('paragraph');
      return Promise.resolve(new Array(1536).fill(index % 10 / 10));
    });

    const chunks = await chunker.chunk(longText);

    expect(chunks.length).toBeGreaterThan(0);
    expect(mockGenerateEmbedding).toHaveBeenCalled();
  });

  it('should handle text with no paragraph breaks', async () => {
    const noBreaksText = 'This is a long text without paragraph breaks. It just keeps going and going.';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(noBreaksText);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle empty paragraphs', async () => {
    const textWithEmpty = 'First paragraph.\n\n\n\nSecond paragraph.';
    mockGenerateEmbedding.mockResolvedValue(new Array(1536).fill(0.5));

    const chunks = await chunker.chunk(textWithEmpty);

    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should handle embedding generation errors gracefully', async () => {
    const text = 'Test paragraph one.\n\nTest paragraph two.';
    
    mockGenerateEmbedding
      .mockResolvedValueOnce(new Array(1536).fill(0.5))
      .mockRejectedValueOnce(new Error('Embedding failed'));

    // Should not throw, but may have fewer chunks
    await expect(chunker.chunk(text)).resolves.toBeDefined();
  });

  it('should combine similar paragraphs into chunks', async () => {
    const similarText = 'Paragraph one about topic A.\n\nParagraph two about topic A.\n\nParagraph three about topic B.';
    
    // First two paragraphs have similar embeddings (high similarity)
    mockGenerateEmbedding
      .mockResolvedValueOnce(new Array(1536).fill(0.9)) // Paragraph 1
      .mockResolvedValueOnce(new Array(1536).fill(0.91)) // Paragraph 2 - similar
      .mockResolvedValueOnce(new Array(1536).fill(0.1)); // Paragraph 3 - different

    const chunks = await chunker.chunk(similarText);

    // Should combine similar paragraphs
    expect(chunks.length).toBeLessThan(3);
  });
});

