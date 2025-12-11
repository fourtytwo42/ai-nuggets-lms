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

jest.mock('@/src/services/content-ingestion/processor', () => ({
  ContentProcessor: jest.fn().mockImplementation(() => ({
    processJob: jest.fn(),
  })),
}));

jest.mock('@/src/lib/db/prisma', () => ({
  prisma: {},
}));

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@/src/services/jobs/queues', () => ({
  processingQueue: {
    name: 'content-processing',
  },
}));

describe('Worker Integration', () => {
  it('should initialize worker module without errors', () => {
    // Delete module cache to force fresh import
    delete require.cache[require.resolve('@/src/workers/index')];
    
    expect(() => {
      require('@/src/workers/index');
    }).not.toThrow();
  });
});
