// Mock logger first
jest.mock('@/src/lib/logger', () => ({
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { TextExtractor } from '@/src/services/content-ingestion/extraction';
import { promises as fs } from 'fs';
import * as cheerio from 'cheerio';

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'PDF content text',
  });
});

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'DOCX content text',
  }),
}));

jest.mock('cheerio', () => ({
  load: jest.fn(),
}));

global.fetch = jest.fn();

describe('TextExtractor', () => {
  let extractor: TextExtractor;

  beforeEach(() => {
    extractor = new TextExtractor();
    jest.clearAllMocks();
  });

  describe('extractFromFile', () => {
    it('should extract text from PDF file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('pdf content'));

      const text = await extractor['extractFromFile']('/path/to/file.pdf');

      expect(text).toBe('PDF content text');
    });

    it('should extract text from DOCX file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('docx content'));

      const text = await extractor['extractFromFile']('/path/to/file.docx');

      expect(text).toBe('DOCX content text');
    });

    it('should extract text from TXT file', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue('Plain text content');

      const text = await extractor['extractFromFile']('/path/to/file.txt');

      expect(text).toBe('Plain text content');
    });

    it('should throw error for unsupported file type', async () => {
      await expect(
        extractor['extractFromFile']('/path/to/file.xyz')
      ).rejects.toThrow('Unsupported file type');
    });
  });

  describe('extractFromURL', () => {
    it('should extract text from URL', async () => {
      const mockHtml = '<html><body><article>Article content</article></body></html>';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const mock$ = jest.fn((selector) => ({
        text: jest.fn().mockReturnValue('Article content'),
        remove: jest.fn().mockReturnThis(),
        map: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue(['Article content']),
        }),
      }));
      mock$.remove = jest.fn().mockReturnThis();
      (cheerio.load as jest.Mock).mockReturnValue(mock$);

      const text = await extractor['extractFromURL']('https://example.com');

      expect(global.fetch).toHaveBeenCalledWith('https://example.com', {
        headers: {
          'User-Agent': 'AI-Microlearning-LMS/1.0',
        },
      });
      expect(text).toBeDefined();
    });

    it('should throw error for failed fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(extractor['extractFromURL']('https://example.com')).rejects.toThrow(
        'Failed to fetch URL'
      );
    });
  });
});

