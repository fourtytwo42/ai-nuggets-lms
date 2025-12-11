import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { promises as fs } from 'fs';
import * as cheerio from 'cheerio';
import logger from '@/src/lib/logger';

export class TextExtractor {
  async extract(source: string, type: 'file' | 'url'): Promise<string> {
    try {
      switch (type) {
        case 'file':
          return await this.extractFromFile(source);
        case 'url':
          return await this.extractFromURL(source);
        default:
          throw new Error(`Unsupported source type: ${type}`);
      }
    } catch (error) {
      logger.error('Text extraction failed', {
        source,
        type,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async extractFromFile(filePath: string): Promise<string> {
    const ext = filePath.toLowerCase().split('.').pop();

    switch (ext) {
      case 'pdf': {
        const pdfBuffer = await fs.readFile(filePath);
        const pdfData = await pdfParse(pdfBuffer);
        return pdfData.text;
      }

      case 'docx': {
        const docxBuffer = await fs.readFile(filePath);
        const result = await mammoth.extractRawText({ buffer: docxBuffer });
        return result.value;
      }

      case 'txt': {
        return await fs.readFile(filePath, 'utf-8');
      }

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async extractFromURL(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AI-Microlearning-LMS/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch URL: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove script and style elements
    $('script, style').remove();

    // Extract text from main content areas
    const text = $('article, main, .content, .post, body')
      .map((_, el) => $(el).text())
      .get()
      .join('\n\n');

    return text.trim();
  }
}

