import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
} from '@/src/lib/errors';

describe('Errors', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('TEST_ERROR', 400, 'Test error message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with fields', () => {
      const fields = { email: 'Invalid email', password: 'Too short' };
      const error = new ValidationError('Validation failed', fields);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
      expect(error.fields).toEqual(fields);
    });

    it('should create a ValidationError without fields', () => {
      const error = new ValidationError('Validation failed');
      
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.fields).toBeUndefined();
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with id', () => {
      const error = new NotFoundError('User', 'user-123');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found: user-123');
    });

    it('should create a NotFoundError without id', () => {
      const error = new NotFoundError('User');
      
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should create an UnauthorizedError with custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError with default message', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should create a ForbiddenError with custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');
      
      expect(error.code).toBe('FORBIDDEN');
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Insufficient permissions');
    });
  });
});

