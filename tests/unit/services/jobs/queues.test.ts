// Mock Redis/ioredis to avoid connection attempts in tests
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn(),
  }));
});

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name) => ({
    name,
    add: jest.fn(),
    process: jest.fn(),
  })),
}));

import { processingQueue, multimediaQueue, embeddingQueue } from '@/src/services/jobs/queues';

describe('Job Queues', () => {
  it('should export processing queue', () => {
    expect(processingQueue).toBeDefined();
    expect(processingQueue.name).toBe('content-processing');
  });

  it('should export multimedia queue', () => {
    expect(multimediaQueue).toBeDefined();
    expect(multimediaQueue.name).toBe('multimedia-generation');
  });

  it('should export embedding queue', () => {
    expect(embeddingQueue).toBeDefined();
    expect(embeddingQueue.name).toBe('embedding-generation');
  });
});

