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

jest.mock('openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI),
  };
});

import { extractMetadata } from '@/src/services/content-ingestion/metadata';
import OpenAI from 'openai';

describe('Metadata Extraction - Basic Tests', () => {
  let openai: OpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    openai = new OpenAI({ apiKey: 'test-key' });
  });

  it('should extract metadata successfully', async () => {
    const mockMetadata = {
      topics: ['topic1', 'topic2'],
      difficulty: 5,
      prerequisites: ['prereq1'],
      estimatedTime: 10,
      relatedConcepts: ['concept1'],
    };

    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockMetadata),
          },
        },
      ],
    });

    const result = await extractMetadata('test content');

    expect(result).toEqual(mockMetadata);
    expect(openai.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
      })
    );
  });

  it('should truncate content to 4000 characters', async () => {
    const longContent = 'a'.repeat(5000);
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              topics: [],
              difficulty: 5,
              prerequisites: [],
              estimatedTime: 5,
              relatedConcepts: [],
            }),
          },
        },
      ],
    });

    await extractMetadata(longContent);

    const callArgs = (openai.chat.completions.create as jest.Mock).mock.calls[0][0];
    expect(callArgs.messages[1].content).toContain(longContent.substring(0, 4000));
  });

  it('should normalize invalid difficulty values', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              topics: [],
              difficulty: 15, // Out of range
              prerequisites: [],
              estimatedTime: 5,
              relatedConcepts: [],
            }),
          },
        },
      ],
    });

    const result = await extractMetadata('test');

    expect(result.difficulty).toBe(10); // Clamped to max
  });

  it('should normalize negative difficulty values', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              topics: [],
              difficulty: -5, // Out of range
              prerequisites: [],
              estimatedTime: 5,
              relatedConcepts: [],
            }),
          },
        },
      ],
    });

    const result = await extractMetadata('test');

    expect(result.difficulty).toBe(1); // Clamped to min
  });

  it('should handle non-array topics', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              topics: 'not an array', // Invalid
              difficulty: 5,
              prerequisites: [],
              estimatedTime: 5,
              relatedConcepts: [],
            }),
          },
        },
      ],
    });

    const result = await extractMetadata('test');

    expect(result.topics).toEqual([]);
  });

  it('should return default metadata on error', async () => {
    (openai.chat.completions.create as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    const result = await extractMetadata('test');

    expect(result).toEqual({
      topics: [],
      difficulty: 5,
      prerequisites: [],
      estimatedTime: 5,
      relatedConcepts: [],
    });
  });

  it('should handle invalid JSON response', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'invalid json',
          },
        },
      ],
    });

    // Should throw JSON parse error, but catch and return defaults
    const result = await extractMetadata('test');

    expect(result).toEqual({
      topics: [],
      difficulty: 5,
      prerequisites: [],
      estimatedTime: 5,
      relatedConcepts: [],
    });
  });
});

