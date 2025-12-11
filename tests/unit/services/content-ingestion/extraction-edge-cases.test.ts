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
const mockCheerioLoad = jest.fn();
const mockFetch = jest.fn();

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn((buffer) => mockPdfParse(buffer)),
}));

jest.mock('mammoth', () => ({
  extractRawText: jest.fn((options) => mockConvertToHtml(options.buffer)),
}));

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

const mockReadFile = fs.readFile as jest.Mock;

describe('TextExtractor Edge Cases', () => {
  let extractor: TextExtractor;

  beforeEach(() => {
    jest.clearAllMocks();
    extractor = new TextExtractor();
  });

  it('should handle PDF with no text content', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('fake pdf'));
    mockPdfParse.mockResolvedValue({ text: '' });

    const result = await extractor.extract('/path/to/empty.pdf', 'file');
    expect(result).toBe('');
  });

  it('should handle DOCX with no text content', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('fake docx'));
    mockConvertToHtml.mockResolvedValue({ value: '', messages: [] });

    const result = await extractor.extract('/path/to/empty.docx', 'file');
    expect(result).toBe('');
  });

  it('should handle URL with 404 error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      extractor.extract('https://example.com/notfound', 'url')
    ).rejects.toThrow('Failed to fetch URL');
  });

  it('should handle URL with 500 error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(
      extractor.extract('https://example.com/error', 'url')
    ).rejects.toThrow('Failed to fetch URL');
  });

  it('should handle URL with network timeout', async () => {
    mockFetch.mockRejectedValue(new Error('Network timeout'));

    await expect(
      extractor.extract('https://example.com', 'url')
    ).rejects.toThrow('Network timeout');
  });

  it('should handle file path with uppercase extension', async () => {
    const textContent = 'Test content.';
    mockReadFile.mockImplementation((path: string, encoding?: string) => {
      if (encoding === 'utf-8') {
        return Promise.resolve(textContent);
      }
      return Promise.resolve(Buffer.from(textContent, 'utf-8'));
    });

    const result = await extractor.extract('/path/to/file.TXT', 'file');
    expect(result).toBe(textContent);
  });

  it('should handle file path with mixed case extension', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('fake pdf'));
    mockPdfParse.mockResolvedValue({ text: 'PDF content' });

    const result = await extractor.extract('/path/to/file.PdF', 'file');
    expect(result).toBe('PDF content');
  });

  it('should handle URL with redirects', async () => {
    const htmlContent = '<html><body><article>Redirected content</article></body></html>';
    const mockRemove = jest.fn().mockReturnThis();
    const mockMap = jest.fn().mockReturnValue({
      get: jest.fn().mockReturnValue(['Redirected content']),
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
      text: jest.fn().mockResolvedValue(htmlContent),
    });

    const result = await extractor.extract('https://example.com/redirect', 'url');
    expect(result).toContain('Redirected content');
  });

  it('should handle file read errors', async () => {
    mockReadFile.mockRejectedValue(new Error('File not found'));

    await expect(
      extractor.extract('/path/to/nonexistent.pdf', 'file')
    ).rejects.toThrow('File not found');
  });
});

