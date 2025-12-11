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

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}));

jest.mock('cheerio', () => ({
  load: jest.fn(),
}));

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

import { TextExtractor } from '@/src/services/content-ingestion/extraction';

describe('TextExtractor Unsupported Types', () => {
  let extractor: TextExtractor;

  beforeEach(() => {
    jest.clearAllMocks();
    extractor = new TextExtractor();
  });

  it('should throw error for unsupported file type', async () => {
    await expect(
      extractor.extract('/path/to/file.xyz', 'file')
    ).rejects.toThrow('Unsupported file type');
  });

  it('should throw error for unsupported source type', async () => {
    await expect(
      extractor.extract('/path/to/file.pdf', 'invalid' as any)
    ).rejects.toThrow('Unsupported source type');
  });

  it('should handle file path with no extension', async () => {
    await expect(
      extractor.extract('/path/to/file', 'file')
    ).rejects.toThrow('Unsupported file type');
  });
});

