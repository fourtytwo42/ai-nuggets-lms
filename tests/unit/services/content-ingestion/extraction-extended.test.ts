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

const mockPdfParse = jest.fn();
const mockConvertToHtml = jest.fn();
const mockFetch = jest.fn();

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn((buffer) => mockPdfParse(buffer)),
}));

jest.mock('mammoth', () => ({
  convertToHtml: jest.fn((buffer) => mockConvertToHtml(buffer)),
}));

const mockCheerioLoad = jest.fn();

jest.mock('cheerio', () => ({
  load: jest.fn((html) => mockCheerioLoad(html)),
}));

global.fetch = mockFetch as jest.Mock;

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

import { TextExtractor } from '@/src/services/content-ingestion/extraction';
import { promises as fs } from 'fs';

describe('TextExtractor Extended', () => {
  let extractor: TextExtractor;

  beforeEach(() => {
    jest.clearAllMocks();
    extractor = new TextExtractor();
  });

  it('should handle PDF extraction errors', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
    mockPdfParse.mockRejectedValue(new Error('PDF parsing failed'));

    await expect(
      extractor.extract('/path/to/file.pdf', 'file')
    ).rejects.toThrow();
  });

  it('should handle DOCX extraction errors', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake docx'));
    mockConvertToHtml.mockRejectedValue(new Error('DOCX conversion failed'));

    await expect(
      extractor.extract('/path/to/file.docx', 'file')
    ).rejects.toThrow();
  });

  it('should handle URL extraction errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(
      extractor.extract('https://example.com', 'url')
    ).rejects.toThrow();
  });

  it('should handle empty PDF content', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
    mockPdfParse.mockResolvedValue({ text: '' });

    const result = await extractor.extract('/path/to/file.pdf', 'file');
    expect(result).toBe('');
  });

  it('should handle URL with no text content', async () => {
    const mockRemove = jest.fn().mockReturnThis();
    const mockMap = jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue([]),
    });
    const mockCheerioInstance = jest.fn().mockReturnValue({
      remove: mockRemove,
      map: mockMap,
    });
    mockCheerioInstance.remove = mockRemove;
    mockCheerioInstance.map = mockMap;
    mockCheerioLoad.mockReturnValue(mockCheerioInstance);
    mockFetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<html><body></body></html>'),
    });

    const result = await extractor.extract('https://example.com', 'url');
    expect(result).toBe('');
  });

  it('should handle unsupported file types', async () => {
    await expect(
      extractor.extract('/path/to/file.xyz', 'file')
    ).rejects.toThrow('Unsupported file type');
  });

  it('should extract text from TXT files', async () => {
    const textContent = 'This is plain text content.';
    // The extraction code calls fs.readFile(filePath, 'utf-8') which returns a string
    (fs.readFile as jest.Mock).mockImplementation((path: string, encoding?: string) => {
      if (encoding === 'utf-8') {
        return Promise.resolve(textContent);
      }
      return Promise.resolve(Buffer.from(textContent, 'utf-8'));
    });

    const result = await extractor.extract('/path/to/file.txt', 'file');
    // Result should be a string
    expect(typeof result).toBe('string');
    expect(result).toBe(textContent);
  });

  it('should handle large PDF files', async () => {
    const largeText = 'Large content. '.repeat(1000);
    (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
    mockPdfParse.mockResolvedValue({ text: largeText });

    const result = await extractor.extract('/path/to/large.pdf', 'file');
    expect(result.length).toBeGreaterThan(1000);
  });
});

