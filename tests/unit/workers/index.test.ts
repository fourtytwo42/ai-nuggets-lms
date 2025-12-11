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

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

jest.mock('@/src/services/jobs/queues', () => ({
  processingQueue: {
    add: jest.fn(),
  },
}));

jest.mock('@/src/services/content-ingestion/processor', () => ({
  ContentProcessor: jest.fn().mockImplementation(() => ({
    processJob: jest.fn(),
  })),
}));

describe('Worker', () => {
  it('should export worker setup', () => {
    // Worker is a side-effect module, just verify it can be imported
    expect(() => {
      require('@/src/workers/index');
    }).not.toThrow();
  });
});

