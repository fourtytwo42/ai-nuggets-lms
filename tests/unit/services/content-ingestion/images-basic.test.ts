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

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock('openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    images: {
      generate: jest.fn(),
    },
  };
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAI),
  };
});

global.fetch = jest.fn();

import { generateImage } from '@/src/services/content-ingestion/images';
import OpenAI from 'openai';
import { promises as fs } from 'fs';

const mockMkdir = fs.mkdir as jest.Mock;
const mockWriteFile = fs.writeFile as jest.Mock;
const mockFetch = global.fetch as jest.Mock;

describe('Image Generation - Basic Tests', () => {
  let openai: OpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    openai = new OpenAI({ apiKey: 'test-key' });
    process.env.STORAGE_PATH = './storage';
  });

  it('should generate image successfully', async () => {
    const mockConcept = 'Machine Learning';
    const mockImageUrl = 'https://example.com/image.png';
    const mockImageBuffer = Buffer.from('image data');

    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: mockConcept,
          },
        },
      ],
    });

    (openai.images.generate as jest.Mock).mockResolvedValue({
      data: [{ url: mockImageUrl }],
    });

    mockFetch.mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(mockImageBuffer),
    });

    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const result = await generateImage('test content', 'nugget-123');

    expect(result).toBe('/storage/images/nugget-123.png');
    expect(openai.chat.completions.create).toHaveBeenCalled();
    expect(openai.images.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'dall-e-3',
        prompt: expect.stringContaining(mockConcept),
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(mockImageUrl);
    expect(mockWriteFile).toHaveBeenCalled();
  });

  it('should truncate content to 1000 characters for concept extraction', async () => {
    const longContent = 'a'.repeat(2000);
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Concept',
          },
        },
      ],
    });
    (openai.images.generate as jest.Mock).mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });
    mockFetch.mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    });
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    await generateImage(longContent, 'nugget-123');

    const callArgs = (openai.chat.completions.create as jest.Mock).mock.calls[0][0];
    expect(callArgs.messages[1].content).toBe(longContent.substring(0, 1000));
  });

  it('should return null if no concept extracted', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: null,
          },
        },
      ],
    });

    const result = await generateImage('test', 'nugget-123');

    expect(result).toBeNull();
    expect(openai.images.generate).not.toHaveBeenCalled();
  });

  it('should return null if concept extraction fails', async () => {
    (openai.chat.completions.create as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    const result = await generateImage('test', 'nugget-123');

    expect(result).toBeNull();
  });

  it('should return null if no image URL returned', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Concept',
          },
        },
      ],
    });
    (openai.images.generate as jest.Mock).mockResolvedValue({
      data: [{}], // No URL
    });

    const result = await generateImage('test', 'nugget-123');

    expect(result).toBeNull();
  });

  it('should return null if image generation fails', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Concept',
          },
        },
      ],
    });
    (openai.images.generate as jest.Mock).mockRejectedValue(
      new Error('Image generation failed')
    );

    const result = await generateImage('test', 'nugget-123');

    expect(result).toBeNull();
  });

  it('should return null if image download fails', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Concept',
          },
        },
      ],
    });
    (openai.images.generate as jest.Mock).mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });
    mockFetch.mockRejectedValue(new Error('Download failed'));

    const result = await generateImage('test', 'nugget-123');

    expect(result).toBeNull();
  });

  it('should return null if file write fails', async () => {
    (openai.chat.completions.create as jest.Mock).mockResolvedValue({
      choices: [
        {
          message: {
            content: 'Concept',
          },
        },
      ],
    });
    (openai.images.generate as jest.Mock).mockResolvedValue({
      data: [{ url: 'https://example.com/image.png' }],
    });
    mockFetch.mockResolvedValue({
      arrayBuffer: jest.fn().mockResolvedValue(Buffer.from('data')),
    });
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockRejectedValue(new Error('Write failed'));

    const result = await generateImage('test', 'nugget-123');

    expect(result).toBeNull();
  });
});

